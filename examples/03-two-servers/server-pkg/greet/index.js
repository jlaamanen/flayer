import * as lib from "flayer/client-lib";

export async function greet(...args) { return lib.executeFlayerFunction("greet", "greet", args); };