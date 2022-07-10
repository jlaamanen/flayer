import { sleep } from "../util";

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
  price: string;
  /**
   * Creation timestamp of the product
   */
  createdAt: Date;
}

const products: Product[] = [
  { id: 1, name: "Product 1", price: "100", createdAt: new Date() },
  { id: 2, name: "Product 2", price: "200", createdAt: new Date() },
  { id: 3, name: "Product 3", price: "300", createdAt: new Date() },
  { id: 4, name: "Product 4", price: "400", createdAt: new Date() },
];

/**
 * Get all products from the database
 * @returns All products
 */
export async function getAllProducts() {
  console.log("GETTING ALL PRODUCTS");
  await sleep(1000);
  return [...products];
}

/**
 * Get a product by ID
 * @param id Product ID
 * @returns Product
 */
export async function getProduct(id: number) {
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
  await sleep(1000);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Product with ID ${id} not found`);
  }
  products[index] = product;
  return product;
}

/**
 * Creates a new product
 * @param product Product
 * @returns Product
 */
export async function createProduct(product: Product) {
  await sleep(1000);
  products.push(product);
  return product;
}

/**
 * Deletes a product
 * @param id Product ID
 * @returns Was the product deleted?
 */
export async function deleteProduct(id: number) {
  await sleep(1000);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Product with ID ${id} not found`);
  }
  products.splice(index, 1);
  return true;
}
