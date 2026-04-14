import { z } from 'zod';

// We define exactly what we expect from the user
export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});