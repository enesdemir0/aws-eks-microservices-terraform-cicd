import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});

// For registration, we can add more rules (like no spaces, etc.)
export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters long").max(20),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});