import { logBodyMetricAction } from "@/lib/actions/metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogMetricPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-md p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Log measurement</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={logBodyMetricAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="measured_at">Date</Label>
              <Input
                id="measured_at"
                name="measured_at"
                type="date"
                defaultValue={today}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField id="weight_kg" label="Weight (kg)" step={0.1} />
              <NumField id="body_fat_pct" label="Body fat %" step={0.1} />
              <NumField id="waist_cm" label="Waist (cm)" step={0.1} />
              <NumField id="chest_cm" label="Chest (cm)" step={0.1} />
              <NumField id="arm_cm" label="Arm (cm)" step={0.1} />
              <NumField id="thigh_cm" label="Thigh (cm)" step={0.1} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function NumField({
  id,
  label,
  step,
}: {
  id: string;
  label: string;
  step: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type="number" step={step} min={0} />
    </div>
  );
}
