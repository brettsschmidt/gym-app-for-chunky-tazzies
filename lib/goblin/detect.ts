// "Are you Brad?" detector. Triggers the goblin easter egg without
// requiring any explicit signup tag.
export function isBrad(opts: {
  displayName?: string | null;
  email?: string | null;
}): boolean {
  const haystack = [opts.displayName, opts.email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  // Match "brad" as a discrete chunk (start of word, end of word, or whole).
  return /(^|[^a-z])brad([^a-z]|$)/.test(haystack);
}
