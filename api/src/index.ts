import Fastify from "fastify";
import { sql } from "drizzle-orm";
import { db } from "./db/lumidb.js";
import { userRoutes } from "./users/user.routes.js";
import jwt from '@fastify/jwt';
import { env } from "./config.js"
import { authRoutes } from "./auth/auth.routes.js";
import { taskRoutes } from "./tasks/task.routes.js";
import { listRoutes } from "./lists/list.routes.js";

const app = Fastify({ logger: true });

app.get("/health/db", async () => {
    await db.execute(sql`select 1`);
    return { status: "ok", database: "connected" };
});

app.get("/hello", async() => {
    return { message: "Lumi-API running on port 3000" };
})

await app.register(jwt, { secret: env.JWT_SECRET });
await app.register(userRoutes);
await app.register(authRoutes);
await app.register(taskRoutes);
await app.register(listRoutes);

try {
    await app.listen({ port: 3000 });
} catch (error) {
    app.log.error(error);
    process.exit(1);
}