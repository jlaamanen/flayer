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

/**
 * Flayer configuration error
 */
export class FlayerConfigError extends FlayerError {}
