"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveUserPrefsAction } from "@/lib/actions/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserPrefsForm({
  prefs,
}: {
  prefs: Record<string, unknown> | null;
}) {
  const [units, setUnits] = useState<string>(
    (prefs?.units as string) ?? "imperial",
  );
  const [theme, setTheme] = useState<string>((prefs?.theme as string) ?? "auto");
  const [isPending, startTransition] = useTransition();

  function submit(fd: FormData) {
    fd.set("units", units);
    fd.set("theme", theme);
    startTransition(async () => {
      await saveUserPrefsAction(fd);
      // Apply theme immediately client-side
      try {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        if (theme !== "auto") root.classList.add(theme);
      } catch {
        /* SSR or no DOM */
      }
      toast.success("Preferences saved");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input
              name="display_name"
              defaultValue={(prefs?.display_name as string) ?? ""}
              placeholder="Optional"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Units</Label>
              <div className="flex gap-1">
                {(["metric", "imperial"] as const).map((u) => (
                  <Button
                    key={u}
                    type="button"
                    size="sm"
                    variant={units === u ? "default" : "outline"}
                    onClick={() => setUnits(u)}
                    className="flex-1 capitalize"
                  >
                    {u}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Theme</Label>
              <div className="flex gap-1">
                {(["light", "auto", "dark"] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={theme === t ? "default" : "outline"}
                    onClick={() => setTheme(t)}
                    className="flex-1 capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Sex</Label>
              <select
                name="sex"
                defaultValue={(prefs?.sex as string) ?? "male"}
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
              >
                <option value="male">male</option>
                <option value="female">female</option>
                <option value="other">other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Height (cm)</Label>
              <Input
                name="height_cm"
                type="number"
                step={0.5}
                defaultValue={(prefs?.height_cm as number | undefined) ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Birth date</Label>
              <Input
                name="birth_date"
                type="date"
                defaultValue={(prefs?.birth_date as string) ?? ""}
              />
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
