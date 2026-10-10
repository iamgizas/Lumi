import type { FastifyInstance } from "fastify";
import { and, desc, eq, param, sql } from "drizzle-orm";
import { authenticate } from "../auth/authenticate.js";
import { db } from "../db/lumidb.js";
import { tasks } from "../db/schema.js";
import { sendValidationError } from "../http/validation.js";
import { createTaskSchema, taskParamsSchema, updateTaskSchema } from "./task.schemas.js";

function ownedTask(taskId: string, userId: string) {
  return and(eq(tasks.id, taskId), eq(tasks.userId, userId));
}

export async function taskRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/tasks", async (request, reply) => {
    const parsed = createTaskSchema.safeParse(request.body);

    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    const [task] = await db
      .insert(tasks)
      .values({ ...parsed.data, userId: request.user.sub })
      .returning();

    return reply.status(201).send(task);
  });

  app.get("/tasks", async (request) => {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, request.user.sub))
      .orderBy(desc(tasks.createdAt));
  });

  app.get("/tasks/:id", async (request, reply) => {
    const params = taskParamsSchema.safeParse(request.params);

    if (!params.success) {
      return sendValidationError(reply, params.error);
    }

    const [task] = await db
      .select()
      .from(tasks)
      .where(ownedTask(params.data.id, request.user.sub))
      .limit(1);

    if (!task) {
      return reply.status(404).send({ error: "task not found" });
    }

    return task;
  });

  app.patch("/tasks/:id", async (request, reply) => {
    const params = taskParamsSchema.safeParse(request.params);

    if (!params.success) {
      return sendValidationError(reply, params.error);
    }

    const body = updateTaskSchema.safeParse(request.body);

    if (!body.success) {
      return sendValidationError(reply, body.error);
    }

    const { completed, ...fields } = body.data;

    const completedAt =
      completed === undefined
        ? undefined
        : completed
          ? sql`coalesce(${tasks.completedAt}, now())`
          : null;

    const [task] = await db
      .update(tasks)
      .set({ ...fields, completedAt, updatedAt: new Date() })
      .where(ownedTask(params.data.id, request.user.sub))
      .returning();

    if (!task) {
      return reply.status(404).send({ error: "task not found" });
    }

    return task;
  });

  app.delete("/tasks/:id", async (request, reply) => {
    const params = taskParamsSchema.safeParse(request.params);

    if (!params.success) {
      return sendValidationError(reply, params.error);
    }

    const [deleted] = await db
      .delete(tasks)
      .where(ownedTask(params.data.id, request.user.sub))
      .returning({ id: tasks.id });

    if (!deleted) {
      return reply.status(404).send({ error: "task not found" });
    }

    return reply.status(204).send();
  });
}
