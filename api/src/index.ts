import Fastify from "fastify";

import { sql } from "drizzle-orm";
import { db } from "./db/lumidb.js";

const app = Fastify({ logger: true });

app.get("/health/db", async () => {
    await db.execute(sql`select 1`);
    return { status: "ok", database: "connected" };
});

app.get("/hello", async() => {
    return { message: "Hello, Lumi!" };
})

try {
    await app.listen({ port: 3000 });
} catch (error) {
    app.log.error(error);
    process.exit(1);
}