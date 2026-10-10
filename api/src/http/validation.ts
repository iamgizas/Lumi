import type { FastifyReply } from "fastify";
import { ZodError, z } from "zod";

export const idParamsSchema = z.object({
    id: z.uuid()
});

export function sendValidationError(reply: FastifyReply, error: ZodError) {
    return reply.status(400).send({
        error: "validation error",
        issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
        })),
    });
}