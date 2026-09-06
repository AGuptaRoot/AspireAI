import { z } from "zod";
export const registerSchema = z.object({
    body: z.object({
        username: z
            .string({ message: "Username is required" })
            .min(3, "Username must be at least 3 characters long")
            .max(50, "Username cannot exceed 50 characters")
            .trim(),
        email: z
            .string({ message: "Email is required" })
            .email("Please provide a valid email address")
            .toLowerCase()
            .trim(),
        password: z
            .string({ message: "Password is required" })
            .min(6, "Password must be at least 6 characters long"),
        profession: z
            .string({ message: "Profession is required" })
            .min(2, "Profession is required")
            .trim(),
    }),
});
export const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ message: "Email is required" })
            .email("Please provide a valid email address")
            .toLowerCase()
            .trim(),
        password: z
            .string({ message: "Password is required" })
            .min(1, "Password is required"),
    }),
});
export const verifyOtpSchema = z.object({
    body: z.object({
        email: z
            .string({ message: "Email is required" })
            .email("Please provide a valid email address")
            .toLowerCase()
            .trim(),
        otp: z.union([
            z.string().min(4, "OTP must be at least 4 digits").max(6, "OTP must be at most 6 digits"),
            z.number().int().positive("OTP must be a positive number"),
        ]),
    }),
});
export const resendOtpSchema = z.object({
    body: z.object({
        email: z
            .string({ message: "Email is required" })
            .email("Please provide a valid email address")
            .toLowerCase()
            .trim(),
    }),
});
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string({ message: "Email is required" })
            .email("Please provide a valid email address")
            .toLowerCase()
            .trim(),
    }),
});
export const resetPasswordSchema = z.object({
    body: z.object({
        email: z
            .string({ message: "Email is required" })
            .email("Please provide a valid email address")
            .toLowerCase()
            .trim(),
        otp: z.union([
            z.string().min(4, "OTP must be at least 4 digits").max(6, "OTP must be at most 6 digits"),
            z.number().int().positive("OTP must be a positive number"),
        ]),
        newPassword: z
            .string({ message: "New password is required" })
            .min(6, "Password must be at least 6 characters long"),
    }),
});
// Backward compatibility alias
export const usersValidSchema = registerSchema;
