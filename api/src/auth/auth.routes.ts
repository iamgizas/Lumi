import type { FastifyInstance } from "fastify";
import argon2 from "argon2"
import { eq } from "drizzle-orm";
import { db } from "../db/lumidb.js";
import { users } from "../db/schema.js";
import { loginSchema } from "./auth.schema.js";

const dummyHash = await argon2.hash("not a real password");

export async function authRoutes(app: FastifyInstance) {
    app.post("/auth/login", async (request, reply) => {
        const parsed = loginSchema.safeParse(request.body);

        if (!parsed.success) {
            return reply.status(400).send({ error: "validation error" });
        }

        const { email, password } = parsed.data;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const passwordOk = await argon2.verify(
            user?.passwordHash ?? dummyHash,
            password,
        );

        if (!user || !passwordOk) {
            return reply.status(401).send({ error: "invalid credentials" });
        }

        const token = app.jwt.sign({ sub: user.id }, { expiresIn: "7d" })

        return { token };
    })
}