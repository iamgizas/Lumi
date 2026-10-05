import type { FastifyReply, FastifyRequest } from "fastify";
import "@fastify/jwt";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: { sub: string };
        user: { sub: string };
    }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "unauthorized" });
    }
}