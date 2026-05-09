import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { completeOnboardingAction } from "@/lib/actions/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: prefs } = await supabase
    .from("user_prefs")
    .select("onboarded_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (prefs?.onboarded_at) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome 👋</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">
            Tell us a bit about you and we'll seed sensible defaults. You can
            change everything later in Settings.
          </p>
          <form action={completeOnboardingAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="o-name">Display name</Label>
              <Input id="o-name" name="display_name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="o-units">Units</Label>
                <select
                  id="o-units"
                  name="units"
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                  defaultValue="metric"
                >
                  <option value="metric">Metric (kg)</option>
                  <option value="imperial">Imperial (lb)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-sex">Sex</Label>
                <select
                  id="o-sex"
                  name="sex"
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                  defaultValue="male"
                >
                  <option value="male">male</option>
                  <option value="female">female</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-height">Height (cm)</Label>
                <Input id="o-height" name="height_cm" type="number" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-bd">Birth date</Label>
                <Input id="o-bd" name="birth_date" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-goal">Primary goal</Label>
                <select
                  id="o-goal"
                  name="goal"
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                  defaultValue="general"
                >
                  <option value="strength">Strength</option>
                  <option value="hypertrophy">Hypertrophy</option>
                  <option value="general">General fitness</option>
                  <option value="cut">Cut</option>
                  <option value="bulk">Bulk</option>
                  <option value="maintain">Maintain</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-exp">Experience</Label>
                <select
                  id="o-exp"
                  name="experience"
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                  defaultValue="intermediate"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-week">Sessions / week</Label>
                <Input
                  id="o-week"
                  name="weekly_session_target"
                  type="number"
                  min={1}
                  max={7}
                  defaultValue={4}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Save and continue
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-muted-foreground text-center text-sm">
        Or{" "}
        <Link href="/dashboard" className="hover:underline">
          skip for now
        </Link>
        .
      </p>
    </div>
  );
}
