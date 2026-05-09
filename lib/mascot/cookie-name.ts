// Shared between server (flash.ts) and client (MascotListener) — kept in its
// own file so the client side doesn't transitively import next/headers.
export const MASCOT_FLASH_COOKIE = "ct_mascot_flash";
