import { executeFlayerFunction } from "flayer/client-lib";

export async function getAllProducts(...args) { return executeFlayerFunction("products", "getAllProducts", args); };
export async function getProduct(...args) { return executeFlayerFunction("products", "getProduct", args); };
export async function updateProduct(...args) { return executeFlayerFunction("products", "updateProduct", args); };
export async function createProduct(...args) { return executeFlayerFunction("products", "createProduct", args); };
export async function deleteProduct(...args) { return executeFlayerFunction("products", "deleteProduct", args); };
export async function onProductsChange(...args) { return executeFlayerFunction("products", "onProductsChange", args); };