// Tazzie mascot message bank. Picked at random per trigger by `pickMessage`.
// Keep them short — they live inside a tiny floating toast.

export type MascotKind =
  | "pr"
  | "set"
  | "hotdog"
  | "session_done"
  | "streak"
  | "rest"
  | "first_session";

export const MASCOT_MESSAGES: Record<MascotKind, readonly string[]> = {
  pr: [
    "this is probably more than Musk could lift",
    "PR! the tazzle is shocked",
    "your dad is even prouder than usual",
    "the gym is calling you 'sir' now",
    "absolute beef hours",
    "the bar called and said ow",
  ],
  set: [
    "your dad is proud of you",
    "one more rep than yesterday",
    "you ate first, didn't you",
    "tazzle approved",
    "form check: vibes immaculate",
    "a tiny bit chunkier (in muscle)",
    "good little chunky tazzie",
    "noted. the iron remembers.",
  ],
  hotdog: [
    "🌭 a noble sacrifice",
    "all-beef policy approved",
    "the bois are proud",
    "fuel = consumed",
    "tomorrow's session gonna be NUCLEAR",
  ],
  session_done: [
    "earned that nap",
    "you absolute unit",
    "session: terminated",
    "lockerroom legend",
    "showered? doubt it. respect tho.",
  ],
  streak: [
    "the streak continues — fear of missing gym (FOMG)",
    "consistency > intensity",
    "you live in the gym now",
  ],
  rest: [
    "sleep is when you actually grow",
    "rest day is part of the plan",
    "see you tomorrow, chunky",
  ],
  first_session: [
    "first session unlocked. welcome to the tazzle.",
    "now we lift",
  ],
};

const SPRITES: Record<MascotKind, string> = {
  pr: "/branding/mascot/fire.png",
  set: "/branding/mascot/thumbs-up.png",
  hotdog: "/branding/mascot/hotdog.png",
  session_done: "/branding/mascot/sleeping.png",
  streak: "/branding/mascot/flex.png",
  rest: "/branding/mascot/sleeping.png",
  first_session: "/branding/mascot/flex.png",
};

export function spriteFor(kind: MascotKind): string {
  return SPRITES[kind];
}

export function pickMessage(kind: MascotKind): string {
  const pool = MASCOT_MESSAGES[kind];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function isMascotKind(s: string): s is MascotKind {
  return s in MASCOT_MESSAGES;
}
