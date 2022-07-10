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
 * @param product Product
 * @returns Product
 */
export function createProduct(product: Product): Promise<Product>;
/**
 * Deletes a product
 * @param id Product ID
 * @returns Was the product deleted?
 */
export function deleteProduct(id: number): Promise<boolean>;

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
