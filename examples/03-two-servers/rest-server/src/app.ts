// Import the framework and instantiate it
import Fastify from "fastify";
import { configure } from "server";
import { greet } from "server/greet";

const fastify = Fastify({
  logger: true,
});

configure({
  url: "http://localhost:1234",
});

fastify.get<{ Params: { name: string } }>(
  "/greet/:name",
  async function handler(req) {
    return { result: await greet(req.params.name ?? "stranger") };
  }
);

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
