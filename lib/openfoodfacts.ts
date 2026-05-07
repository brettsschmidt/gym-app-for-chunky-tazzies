/**
 * Tiny client for OpenFoodFacts.
 * Used by `/api/foods/lookup` after we miss in our local catalog.
 */
const OFF_BASE = "https://world.openfoodfacts.org/api/v2/product";

export interface BarcodeFood {
  name: string;
  brand: string | null;
  serving_size_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  barcode: string;
}

interface OFFResponse {
  status?: number;
  product?: {
    product_name?: string;
    brands?: string;
    serving_quantity?: string | number;
    serving_size?: string;
    nutriments?: Record<string, number | string | undefined>;
  };
}

export async function lookupBarcode(barcode: string): Promise<BarcodeFood | null> {
  const trimmed = barcode.replace(/\D/g, "");
  if (!trimmed) return null;

  const url = `${OFF_BASE}/${trimmed}.json?fields=product_name,brands,serving_quantity,serving_size,nutriments`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ChunkyTazzies/0.1 (+https://github.com/brettsschmidt/gym-app-for-chunky-tazzies)" },
    next: { revalidate: 60 * 60 * 24 * 7 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as OFFResponse;
  if (json.status !== 1 || !json.product) return null;

  const p = json.product;
  const n = p.nutriments ?? {};
  const num = (key: string): number => {
    const raw = n[key];
    if (raw == null) return 0;
    const v = typeof raw === "string" ? Number(raw) : raw;
    return Number.isFinite(v) ? v : 0;
  };

  // OFF nutriments end in `_100g` for per-100g values.
  return {
    name: p.product_name?.trim() || "Untitled food",
    brand: p.brands?.split(",")[0]?.trim() || null,
    serving_size_g: 100,
    kcal: num("energy-kcal_100g") || num("energy_100g") / 4.184,
    protein_g: num("proteins_100g"),
    carbs_g: num("carbohydrates_100g"),
    fat_g: num("fat_100g"),
    fiber_g: num("fiber_100g") || null,
    sugar_g: num("sugars_100g") || null,
    sodium_mg: (num("sodium_100g") || num("salt_100g") / 2.5) * 1000,
    barcode: trimmed,
  };
}
