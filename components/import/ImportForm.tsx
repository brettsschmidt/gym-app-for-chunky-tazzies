"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { importStrongCsvAction } from "@/lib/actions/import";
import { Button } from "@/components/ui/button";

export function ImportForm({ tazzleId }: { tazzleId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function submit() {
    if (!file) {
      toast.error("Choose a CSV first");
      return;
    }
    startTransition(async () => {
      const text = await file.text();
      const fd = new FormData();
      fd.set("csv", text);
      fd.set("chunky_tazzle_id", tazzleId);
      const res = await importStrongCsvAction(fd);
      setResult(
        `Imported ${res.sessions} sessions, ${res.exercises} exercise lines, ${res.sets} sets.`,
      );
      toast.success("Import complete");
    });
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block text-sm"
      />
      <Button type="button" disabled={!file || isPending} onClick={submit}>
        {isPending ? "Importing…" : "Import"}
      </Button>
      {result && <p className="text-emerald-600 text-sm">{result}</p>}
    </div>
  );
}
