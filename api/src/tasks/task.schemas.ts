import { z } from "zod";
import { priorityEnum } from "../db/schema.js";

const dueAt = z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value));

export const createTaskSchema = z.object({
    title: z.string().trim().min(1).max(200),
    dueAt: dueAt.optional(),
    priority: z.enum(priorityEnum.enumValues).optional(),
});

export const updateTaskSchema = z
    .object({
        title: z.string().trim().min(1).max(200),
        dueAt: dueAt.nullable(),
        priority: z.enum(priorityEnum.enumValues).nullable(),
        completed: z.boolean(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "at least one field is required",
    });

export const taskParamsSchema = z.object({
    id: z.uuid(),
})