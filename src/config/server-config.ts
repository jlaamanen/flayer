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
    store?: {
      get: () => string;
      set: (id: string) => void;
      destroy: () => void;
    };
    secret: string | string[];
  };
}

/**
 * Default server config values
 */
export const defaultServerConfig: ServerConfig = {
  port: 1234,
};
