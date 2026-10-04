import { z } from "zod";

export const registerUserSchema = z.object({
    name: z.string().trim().min(1).max(100),
    nickname: z.string().trim().min(1).max(50),
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(8).max(128),
});