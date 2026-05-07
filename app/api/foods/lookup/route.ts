import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { lookupBarcode } from "@/lib/openfoodfacts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const barcode = (url.searchParams.get("barcode") ?? "").trim();
  if (!barcode) {
    return NextResponse.json({ error: "missing_barcode" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("nutrition_foods")
    .select("id, name, brand, serving_size_g, kcal, protein_g, carbs_g, fat_g, fiber_g, barcode")
    .eq("barcode", barcode)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ source: "local", food: existing });
  }

  const off = await lookupBarcode(barcode);
  if (!off) {
    return NextResponse.json({ source: "miss" }, { status: 404 });
  }
  return NextResponse.json({ source: "openfoodfacts", food: off });
}
