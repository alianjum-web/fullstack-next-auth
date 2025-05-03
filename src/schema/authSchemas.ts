import { z } from "zod";

export const loginSchema = z.object({
    email: z.string()
        .min(1, "Email is required")
        .email("Invalid email format"),
    password: z.string()
        .min(1, "Password is required")
        .min(6, "Passord must be atleast 6 characters")
        .max(50, "Passwod must be less than 50 characters")
})

export type LoginFormData = z.infer<typeof loginSchema>;