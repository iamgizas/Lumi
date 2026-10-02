import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/health", async () => {
    return { status: "ok" };
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