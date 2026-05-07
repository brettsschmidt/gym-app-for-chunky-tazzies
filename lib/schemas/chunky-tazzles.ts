import { z } from "zod";

export const createTazzleSchema = z.object({
  name: z.string().trim().min(1).max(80),
  timezone: z.string().trim().max(64).optional(),
});
export type CreateTazzleInput = z.infer<typeof createTazzleSchema>;

export const createInviteSchema = z.object({
  chunky_tazzle_id: z.string().uuid(),
  max_uses: z.coerce.number().int().min(1).max(50).default(5),
  expires_in_days: z.coerce.number().int().min(1).max(60).optional(),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const redeemInviteSchema = z.object({
  code: z.string().trim().min(4).max(40),
});
export type RedeemInviteInput = z.infer<typeof redeemInviteSchema>;
