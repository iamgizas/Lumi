import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import { authenticate } from "../auth/authenticate.js";
import { db } from "../db/lumidb.js";
import { tasks } from "../db/schema.js"
import { createTaskSchema } from "./task.schemas.js";

export async function taskRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authenticate);

    app.post("/tasks", async (request, reply) => {
        const parsed = createTaskSchema.safeParse(request.body);

        if (!parsed.success) {
            return reply.status(400).send({
                error: "validation error",
                issues: parsed.error.issues.map((issue) => ({
                    path: issue.path.join("."),
                    message: issue.message,
                })),
            });
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
}