/**
 * Parse a Strong app CSV export. Strong's "Strong CSV" columns are:
 *   Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,
 *   Distance,Seconds,Notes,Workout Notes,RPE
 *
 * Returns a normalised list of session rows, each with its sets, that the
 * import server action can insert into the gym schema.
 */

export interface ImportedSet {
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_warmup: boolean;
  notes: string | null;
}

export interface ImportedExercise {
  exercise_name: string;
  sets: ImportedSet[];
}

export interface ImportedSession {
  workout_name: string;
  started_at: string;
  notes: string | null;
  exercises: ImportedExercise[];
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function parseStrongCsv(csv: string): ImportedSession[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const cDate = idx("Date");
  const cWorkout = idx("Workout Name");
  const cExercise = idx("Exercise Name");
  const cSetOrder = idx("Set Order");
  const cWeight = idx("Weight");
  const cReps = idx("Reps");
  const cRpe = idx("RPE");
  const cNotes = idx("Notes");
  const cWorkoutNotes = idx("Workout Notes");

  const sessions = new Map<string, ImportedSession>();
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < headers.length) continue;
    const date = cols[cDate];
    const workout = cols[cWorkout];
    const key = `${date}|${workout}`;
    let session = sessions.get(key);
    if (!session) {
      session = {
        workout_name: workout || "Imported workout",
        started_at: new Date(date.replace(" ", "T")).toISOString(),
        notes: cWorkoutNotes >= 0 ? cols[cWorkoutNotes] || null : null,
        exercises: [],
      };
      sessions.set(key, session);
    }
    const exName = cols[cExercise];
    let ex = session.exercises.find((e) => e.exercise_name === exName);
    if (!ex) {
      ex = { exercise_name: exName, sets: [] };
      session.exercises.push(ex);
    }
    const setNumber = Number(cols[cSetOrder]) || ex.sets.length + 1;
    const isWarmup = String(cols[cSetOrder]).toLowerCase().includes("warm");
    ex.sets.push({
      set_number: setNumber,
      weight_kg: parseFloat(cols[cWeight]) || null,
      reps: parseInt(cols[cReps], 10) || null,
      rpe: cRpe >= 0 ? parseFloat(cols[cRpe]) || null : null,
      is_warmup: isWarmup,
      notes: cNotes >= 0 ? cols[cNotes] || null : null,
    });
  }
  return [...sessions.values()];
}
