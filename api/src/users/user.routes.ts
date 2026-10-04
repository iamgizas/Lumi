import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { db } from "../db/lumidb.js";
import { users } from "../db/schema.js";
import { registerUserSchema } from "./user.schemas.js";
import { isUniqueViolation } from "../db/errors.js";

export async function userRoutes(app: FastifyInstance) {
  app.post("/users", async (request, reply) => {
    const parsed = registerUserSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "validation_error",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { name, nickname, email, password } = parsed.data;
    const passwordHash = await argon2.hash(password);

    try {
      const [user] = await db
        .insert(users)
        .values({ name, nickname, email, passwordHash })
        .returning({
          id: users.id,
          name: users.name,
          nickname: users.nickname,
          email: users.email,
          createdAt: users.createdAt,
        });

      return reply.status(201).send(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.status(409).send({ error: "email_aready_registered" });
      }
      throw error;
    }
  });
}
