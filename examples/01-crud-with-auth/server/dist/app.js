"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var static_1 = require("@fastify/static");
var fastify_1 = require("fastify");
var flayer_1 = require("flayer");
var path_1 = require("path");
var port = 1234;
var server = (0, flayer_1.createServer)({
    products: require("./modules/products"),
    user: require("./modules/user"),
});
if (process.env.NODE_ENV === "development") {
    server.generatePackage({
        path: "../server-pkg",
    });
}
server.start({
    port: port,
    session: {
        secret: "V3ryZ3kr3tW0rd",
    },
});
// Serve static frontend assets for the production image
var staticFileServer = (0, fastify_1.default)();
staticFileServer.register(static_1.default, {
    root: (0, path_1.resolve)(__dirname, "../static"),
});
staticFileServer.listen({ port: 80, host: "0.0.0.0" });
