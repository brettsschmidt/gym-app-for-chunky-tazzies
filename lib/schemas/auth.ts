import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Required"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
    displayName: z.string().trim().min(1, "Required").max(60),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });
export type SignUpInput = z.infer<typeof signUpSchema>;

export const resetSchema = z.object({ email: emailSchema });
export type ResetInput = z.infer<typeof resetSchema>;
