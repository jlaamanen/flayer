import { createServer } from "flayer";

const server = createServer({
  greet: await import("./modules/greet"),
});

if (process.env.NODE_ENV === "development") {
  await server.generatePackage({
    path: "../server-pkg",
  });
}

server.start({
  port: 1234,
  session: {
    secret: "V3ryZ3kr3tW0rd",
  },
});
