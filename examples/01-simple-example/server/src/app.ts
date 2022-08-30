import { createServer } from "flayer";
import * as products from "./modules/products";
import * as user from "./modules/user";

const server = createServer({
  products,
  user,
});

if (process.env.NODE_ENV === "development") {
  server.generatePackage({
    path: "../server-pkg",
    flayerVersion: "file:../../..",
    packageJson: {
      name: "server-pkg",
      version: "0.0.1",
    },
  });
}

server.start({
  port: 1234,
  session: {
    secret: "aaaaaaaa",
  },
});
