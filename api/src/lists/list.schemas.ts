import z from "zod";

const listName = z.string().trim().min(1).max(200);

export const createListSchema = z.object({
    name: listName,
})

export const updateListSchema = z.object({
    name: listName,
});

export const addTaskToListSchema = z.object({
    taskId: z.uuid(),
});

export const listTaskParamsSchema = z.object({
    id: z.uuid(),
    taskId: z.uuid(),
});