import { SessionConfig } from "../session";

/**
 * Normalized server configuration.
 *
 * For internal use.
 */
export interface ServerConfig {
  /**
   * Flayer server port
   *
   * Default `1234`
   */
  port?: number;
  session?: SessionConfig;
}

/**
 * Default server config values
 */
export const defaultServerConfig: ServerConfig = {
  port: 1234,
};
