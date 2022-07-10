import "dotenv/config";
import { createServer } from "flayer";
import * as products from "./modules/products";

const server = createServer({
  products,
  module: {
    subModule: {
      subSubModule: {
        helloWorld: (a: number, b: number) => {
          return a + b;
        },
      },
    },
  },
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
});
