const { executeFlayerFunction } = require("flayer/dist/lib");

export async function saveData(...args) { return executeFlayerFunction("sessionTest", "saveData", args); };
export async function getData(...args) { return executeFlayerFunction("sessionTest", "getData", args); };