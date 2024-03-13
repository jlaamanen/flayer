import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import { createServer } from "flayer";
import { resolve } from "path";

const port = 1234;

const server = createServer({
  products: require("./modules/products"),
  user: require("./modules/user"),
});

const mode = process.env.MODE?.split(",") ?? ["server"];

if (mode.includes("generate")) {
  server.generatePackage({
    path: "../server-pkg",
  });
}

if (mode.includes("server")) {
  server.start({
    port,
    session: {
      secret: "V3ryZ3kr3tW0rd",
    },
  });

  // Serve static frontend assets for the production image
  const staticFileServer = fastify();
  staticFileServer.register(fastifyStatic, {
    root: resolve(__dirname, "../static"),
  });
  staticFileServer.listen({ port: 80, host: "0.0.0.0" });
}
