const { executeFlayerFunction } = require("flayer/dist/lib");

exports.getStuff = function(...args) { return executeFlayerFunction("hello", "getStuff", args); };
exports.getShit = function(...args) { return executeFlayerFunction("hello", "getShit", args); };