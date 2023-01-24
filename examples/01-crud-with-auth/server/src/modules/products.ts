import { onDisconnect } from "flayer";
import { assertIsAdmin, assertIsLoggedIn } from "../guards";
import { sleep } from "../util";

// Product change callback listeners
let listeners: ((products: Product[]) => void)[] = [];

/**
 * Product
 */
interface Product {
  /**
   * ID of the product
   */
  id: number;
  /**
   * Name of the product
   */
  name: string;
  /**
   * Price of the product
   */
  price: number;
  /**
   * Creation timestamp of the product
   */
  createdAt: Date;
}

const products: Product[] = [
  { id: 1, name: "Product 1", price: 100, createdAt: new Date() },
  { id: 2, name: "Product 2", price: 200, createdAt: new Date() },
  { id: 3, name: "Product 3", price: 300, createdAt: new Date() },
  { id: 4, name: "Product 4", price: 400, createdAt: new Date() },
];

/**
 * Notify all listeners that the products were changed
 */
function notifyProductsChanged() {
  listeners.forEach((callback) => {
    callback(products);
  });
}

/**
 * Get all products from the database
 * @returns All products
 */
export async function getAllProducts() {
  await assertIsLoggedIn();
  await sleep(1000);
  return [...products];
}

/**
 * Get a product by ID
 * @param id Product ID
 * @returns Product
 */
export async function getProduct(id: number) {
  await assertIsLoggedIn();
  await sleep(1000);
  return products.find((product) => product.id === id);
}

/**
 * Updates an existing product
 * @param id Product ID
 * @param product Product
 * @returns Product
 */
export async function updateProduct(id: number, product: Product) {
  await assertIsAdmin();
  await sleep(1000);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Product with ID ${id} not found`);
  }
  products[index] = product;
  notifyProductsChanged();
  return product;
}

/**
 * Creates a new product
 * @param product Product (without ID and created at)
 * @returns Product
 */
export async function createProduct(
  product: Omit<Product, "id" | "createdAt">
) {
  await assertIsAdmin();
  await sleep(1000);
  const id = Math.max(...products.map((product) => product.id)) + 1;
  products.push({
    ...product,
    id,
    createdAt: new Date(),
  });
  notifyProductsChanged();
  return product;
}

/**
 * Deletes a product
 * @param id Product ID
 * @returns Was the product deleted?
 */
export async function deleteProduct(id: number) {
  await assertIsAdmin();
  await sleep(1000);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Product with ID ${id} not found`);
  }
  products.splice(index, 1);
  notifyProductsChanged();
  return true;
}

/**
 * Assign a listener that gets executed whenever products are changed.
 * @param callback Callback function
 */
export async function onProductsChange(
  callback: (products: Product[]) => void
) {
  listeners.push(callback);

  onDisconnect(() => {
    listeners = listeners.filter((listener) => listener !== callback);
  });
}
