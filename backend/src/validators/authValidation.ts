import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  otp: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'Verification code must contain only numbers')
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export const sendOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  otp: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'Verification code must contain only numbers'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
