import { customAlphabet } from "nanoid";

const slug = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);

export function newSlug(): string {
  return slug();
}

export function buildShareUrl(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/share/${slug}`;
}
