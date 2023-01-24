import { executeFlayerFunction } from "flayer/client-lib";

export async function getUsers(...args) { return executeFlayerFunction("user", "getUsers", args); };
export async function authenticate(...args) { return executeFlayerFunction("user", "authenticate", args); };
export async function getLoggedInUser(...args) { return executeFlayerFunction("user", "getLoggedInUser", args); };
export async function logout(...args) { return executeFlayerFunction("user", "logout", args); };