import { Store } from "express-session";
import { Server } from "ws";
import { FlayerConfigError } from "../error";
import { DeepRequired } from "../utils";

type RequestHandler = (this: Server, ...args: any[]) => void;

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
  /**
   * Maximum amount of WebSocket server listeners.
   *
   * Default 0 (unlimited)
   */
  maxListeners?: number;
  /**
   * Handler for incoming HTTP requests
   */
  onRequest?: RequestHandler | null;
  /**
   * Session configuration
   */
  session?: SessionConfig;
}

export interface SessionConfig {
  /**
   * Cookie configurations
   */
  cookie?: {
    /**
     * Cookie domain
     * @default null
     */
    domain?: string | null;
    /**
     * Cookie expires
     * @default null
     */
    expires?: string | null;
    /**
     * Cookie HTTP only
     * @default true
     */
    httpOnly?: boolean;
    /**
     * Cookie max age
     * @default null
     */
    maxAge?: number | null;
    /**
     * Cookie path
     * @default null
     */
    path?: string | null;
    /**
     * Cookie secure
     * @default true
     */
    secure?: boolean;
    /**
     * Cookie same site
     * @default null
     */
    sameSite?: "Strict" | "Lax" | null;
  };
  /**
   * Session store
   *
   * Accepts express-session compatible stores.
   */
  store?: Store | null;
  /**
   * Session secret
   *
   * Used for signing session IDs for cookies to avoid session hijacking.
   */
  secret: string | string[];
}

/**
 * Server config with all fields filled.
 *
 * We cannot use only the DeepRequired helper type here, because Store should not
 * be affected, as it's an external type (from express-session).
 *
 * For internal use only.
 */
export type NormalizedServerConfig = DeepRequired<
  Omit<ServerConfig, "onRequest" | "session">
> & {
  onRequest: RequestHandler | null;
  session: DeepRequired<Omit<SessionConfig, "store">> & {
    store: Store | null;
  };
};

/**
 * Fill the given object with default values unless provided.
 * @param config
 * @returns
 */
export function normalizeServerConfig(
  config: ServerConfig | undefined
): NormalizedServerConfig {
  if (!config?.session?.secret) {
    throw new FlayerConfigError("Session secret not configured");
  }
  return {
    port: config?.port ?? 1234,
    maxListeners: config?.maxListeners ?? 0,
    onRequest: config?.onRequest ?? null,
    session: {
      cookie: {
        domain: null,
        expires: null,
        httpOnly: true,
        maxAge: null,
        path: null,
        secure: true,
        sameSite: null,
        ...config?.session?.cookie,
      },
      store: config?.session?.store ?? null,
      secret: config?.session.secret,
    },
  };
}
