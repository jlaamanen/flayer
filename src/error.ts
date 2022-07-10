/**
 * General Flayer error
 */
export class FlayerError extends Error {}

/**
 * Flayer timeout error
 */
export class FlayerTimeoutError extends FlayerError {}

/**
 * Flayer connection error
 */
export class FlayerConnectionError extends FlayerError {}
