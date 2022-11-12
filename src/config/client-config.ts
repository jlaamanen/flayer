import { FlayerConfigError } from "../error";
import { DeepRequired } from "../utils";

/**
 * Client-side configuration for connecting to a Flayer server.
 */
export interface ClientConfig {
  /**
   * URL of the Flayer server WebSocket handle.
   * @example "ws://localhost:8080"
   */
  url: string;
  /**
   * Generic timeout for function execution in milliseconds.
   *
   * If a function takes longer than this timeout, it will be aborted and an error will be thrown.
   */
  timeout?: number | null;
}

/**
 * Client config with all fields filled.
 *
 * For internal use only.
 */
export type NormalizedClientConfig = DeepRequired<ClientConfig>;

/**
 * Fills user-given client config with default values unless provided.
 * @param config User-given config
 * @returns Normalized config
 */
export function normalizeClientConfig(
  config: ClientConfig | undefined
): NormalizedClientConfig {
  if (!config?.url) {
    throw new FlayerConfigError("URL not configured");
  }
  return {
    url: config.url,
    timeout: config.timeout ?? null,
  };
}
