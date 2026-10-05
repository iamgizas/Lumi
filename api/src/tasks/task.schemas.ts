import { z } from "zod";
import { priorityEnum } from "../db/schema.js";

export const createTaskSchema = z.object({
    title: z.string().trim().min(1).max(200),
    dueAt: z.iso
       .datetime({ offset: true })
       .transform((value) => new Date(value))
       .optional(),
    priority: z.enum(priorityEnum.enumValues).optional(),
});