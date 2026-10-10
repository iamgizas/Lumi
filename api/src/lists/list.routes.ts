import type { FastifyInstance } from "fastify";
import { and, asc, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { authenticate } from "../auth/authenticate.js";
import { db } from "../db/lumidb.js";
import { isUniqueViolation } from "../db/errors.js";
import { lists, listTasks, tasks } from "../db/schema.js";
import { idParamsSchema, sendValidationError } from "../http/validation.js";
import { addTaskToListSchema, createListSchema, listTaskParamsSchema, updateListSchema } from "./list.schemas.js";

function ownedList(listId: string, userId: string) {
  return and(eq(lists.id, listId), eq(lists.userId, userId));
}

async function userOwnsList(listId: string, userId: string) {
  const [list] = await db
    .select({ id: lists.id })
    .from(lists)
    .where(ownedList(listId, userId))
    .limit(1);

  return list !== undefined;
}

export async function listRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/lists", async (request, reply) => {
    const parsed = createListSchema.safeParse(request.body);

    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    const [list] = await db
      .insert(lists)
      .values({ ...parsed.data, userId: request.user.sub })
      .returning();

    return reply.status(201).send(list);
  });

  app.get("/lists", async (request) => {
    return db
      .select()
      .from(lists)
      .where(eq(lists.userId, request.user.sub))
      .orderBy(desc(lists.createdAt));
  });

  app.get("/lists/:id", async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success) {
      return sendValidationError(reply, params.error);
    }

    const [list] = await db
      .select()
      .from(lists)
      .where(ownedList(params.data.id, request.user.sub))
      .limit(1);

    if (!list) {
      return reply.status(404).send({ error: "list_not_found" });
    }

    return list;
  });

  app.patch("/lists/:id", async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success) {
      return sendValidationError(reply, params.error);
    }

    const body = updateListSchema.safeParse(request.body);

    if (!body.success) {
      return sendValidationError(reply, body.error);
    }

    const [list] = await db
      .update(lists)
      .set({ ...body.data, updatedAt: new Date() })
      .where(ownedList(params.data.id, request.user.sub))
      .returning();

    if (!list) {
      return reply.status(404).send({ error: "list_not_found" });
    }

    return list;
  });

  app.delete("/lists/:id", async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success) {
      return sendValidationError(reply, params.error);
    }

    const [deleted] = await db
      .delete(lists)
      .where(ownedList(params.data.id, request.user.sub))
      .returning({ id: lists.id });

    if (!deleted) {
      return reply.status(404).send({ error: "list_not_found" });
    }

    return reply.status(204).send();
  });

  app.get("/lists/:id/tasks", async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success) {
      return sendValidationError(reply, params.error);
    }

    const listId = params.data.id;

    if (!(await userOwnsList(listId, request.user.sub))) {
      return reply.status(404).send({ error: "list_not_found" });
    }

    return db
      .select({ ...getTableColumns(tasks), position: listTasks.position })
      .from(listTasks)
      .innerJoin(tasks, eq(listTasks.taskId, tasks.id))
      .where(eq(listTasks.listId, listId))
      .orderBy(asc(listTasks.position));
  });

  app.post("/lists/:id/tasks", async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success) {
      return sendValidationError(reply, params.error);
    }

    const body = addTaskToListSchema.safeParse(request.body);

    if (!body.success) {
      return sendValidationError(reply, body.error);
    }

    const listId = params.data.id;
    const { taskId } = body.data;
    const userId = request.user.sub;

    if (!(await userOwnsList(listId, userId))) {
      return reply.status(404).send({ error: "list_not_found" });
    }

    const [task] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task) {
      return reply.status(404).send({ error: "task_not_found" });
    }

    const [{ next }] = await db
      .select({
        next: sql<number>`coalesce(max(${listTasks.position}), -1) + 1`,
      })
      .from(listTasks)
      .where(eq(listTasks.listId, listId));

    try {
      await db.insert(listTasks).values({ listId, taskId, position: next });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.status(409).send({ error: "task_already_in_list" });
      }
      throw error;
    }

    return reply.status(201).send({ listId, taskId, position: next });
  });

  app.delete("/lists/:id/tasks/:taskId", async (request, reply) => {
    const params = listTaskParamsSchema.safeParse(request.params);

    if (!params.success) {
      return sendValidationError(reply, params.error);
    }

    const { id: listId, taskId } = params.data;

    if (!(await userOwnsList(listId, request.user.sub))) {
      return reply.status(404).send({ error: "list_not_found" });
    }

    const [removed] = await db
      .delete(listTasks)
      .where(and(eq(listTasks.listId, listId), eq(listTasks.taskId, taskId)))
      .returning({ taskId: listTasks.taskId });

    if (!removed) {
      return reply.status(404).send({ error: "task_not_in_list" });
    }

    return reply.status(204).send();
  });
}
