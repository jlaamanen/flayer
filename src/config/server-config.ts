import getPort from "get-port";

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
  session?: {
    cookie?: {
      domain?: string;
      expires?: string;
      httpOnly?: boolean;
      maxAge?: number;
      path?: string;
      secure?: boolean;
      sameSite?: "Strict" | "Lax";
    };
    // TODO express-session like stores? they'd use old-school callback-based API
    store: {
      get: () => string;
      set: (id: string) => void;
      destroy: () => void;
    };
    secret: string;
  }
}

/**
 * Flayer server configuration
 */
// export type ServerConfig = PartialDeep<NormalizedServerConfig>;

/**
 * Default server config values
 */
export const defaultServerConfig = {
  port: 1234,
};

/**
 * Normalizes given partial server configuration.
 *
 * Fills the values with the following order:
 * 1. environment
 * 2. configuration given as an argument
 * 3. default values
 * @param config Partial server configuration
 * @returns Normalized server configuration
 */
export async function normalizeServerConfig(
  config: ServerConfig
): Promise<ServerConfig> {
  // Find first available port from given options - a random one is assigned if all are in use
  const port = await getPort({
    port: [
      config.port,
      process.env.FLAYER_SERVER_PORT != null
        ? Number(process.env.FLAYER_SERVER_PORT)
        : null,
      defaultServerConfig.port,
    ].filter(Boolean),
  });
  return {
    port,
  };
}
