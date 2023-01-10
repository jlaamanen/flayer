/**
 * Get all products from the database
 * @returns All products
 */
export function getAllProducts(): Promise<Product[]>;
/**
 * Get a product by ID
 * @param id Product ID
 * @returns Product
 */
export function getProduct(id: number): Promise<Product>;
/**
 * Updates an existing product
 * @param id Product ID
 * @param product Product
 * @returns Product
 */
export function updateProduct(id: number, product: Product): Promise<Product>;
/**
 * Creates a new product
 * @param product Product (without ID and created at)
 * @returns Product
 */
export function createProduct(product: Omit<Product, "id" | "createdAt">): Promise<Omit<Product, "id" | "createdAt">>;
/**
 * Deletes a product
 * @param id Product ID
 * @returns Was the product deleted?
 */
export function deleteProduct(id: number): Promise<boolean>;
/**
 * Assign a listener that gets executed whenever products are changed.
 * @param callback Callback function
 */
export function onProductsChange(callback: (products: Product[]) => void): Promise<void>;

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
