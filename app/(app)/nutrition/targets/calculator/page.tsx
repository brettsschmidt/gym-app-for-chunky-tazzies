import Link from "next/link";
import { TdeeCalculator } from "@/components/nutrition/TdeeCalculator";
import { Button } from "@/components/ui/button";

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">TDEE calculator</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/nutrition/targets">← Targets</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Mifflin-St Jeor BMR multiplied by activity, then a goal modifier. The
        macro split anchors protein at 2 g/kg, fat at ~25 % of kcal, with carbs
        filling the remainder. Tweak the inputs and copy the targets that suit you.
      </p>
      <TdeeCalculator />
    </div>
  );
}
