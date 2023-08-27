import { executeFlayerFunction } from "flayer/client-lib/index.js";

export async function greet(...args) { return executeFlayerFunction("hello", "greet", args); };