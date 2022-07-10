const { executeFlayerFunction } = require("flayer/dist/lib");

export async function helloWorld(...args) { return executeFlayerFunction("module/subModule/subSubModule", "helloWorld", args); };