import { sign, unsign } from "cookie-signature";
import { Store } from "express-session";
import { IncomingMessage } from "http";
import UID from "uid-safe";
import { getSessionId } from "./async-store";
import { ServerConfig } from "./config/server-config";
import { FlayerError } from "./error";
import { collapse } from "./utils";

const sessionCookieKey = "flayer-session";
let store: Store = null;

export interface Session {}

export interface SessionConfig {
  /**
   * Cookie configurations
   */
  cookie?: {
    domain?: string;
    expires?: string;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    secure?: boolean;
    sameSite?: "Strict" | "Lax";
  };
  /**
   * Session store
   *
   * Accepts express-session compatible stores.
   */
  store?: Store;
  /**
   * Session secret
   *
   * Used for signing session IDs for cookies to avoid session hijacking.
   */
  secret: string | string[];
}

/**
 * Generates a unique session ID.
 * @returns Session ID
 */
function generateSessionId() {
  return UID.sync(24);
}

/**
 * Signs the given session ID with a secret defined in server config.
 * @param sessionId Session ID
 * @param serverConfig Server config
 * @returns Signed session ID
 */
function signSessionId(sessionId: string, serverConfig: ServerConfig) {
  const secret =
    typeof serverConfig.session?.secret === "string"
      ? serverConfig.session.secret
      : serverConfig.session?.secret?.[0];
  if (!secret) {
    return sessionId;
  }
  return sign(sessionId, secret);
}

/**
 * Tries to unsign given session ID with secret(s) found from server config.
 * @param signedSessionId Signed session ID
 * @param serverConfig Server config
 * @returns Unsigned secret
 */
function unsignSessionId(signedSessionId: string, serverConfig: ServerConfig) {
  const secrets =
    typeof serverConfig.session?.secret === "string"
      ? [serverConfig.session.secret]
      : serverConfig.session?.secret ?? [];
  const result = secrets.reduce<string | false>(
    (result, secret) => result || unsign(signedSessionId, secret),
    false
  );
  return result || signedSessionId;
}

/**
 * Tries to parse a session ID from cookies.
 * If not found, generates a new ID.
 * @param cookies
 * @param serverConfig
 */
export function getSessionIdFromCookies(
  cookies: string,
  serverConfig: ServerConfig
) {
  const sessionIdCookie = cookies
    ?.split(";")
    .find((cookie) => cookie.startsWith(sessionCookieKey));
  if (sessionIdCookie) {
    const signedId = sessionIdCookie.split("=")[1];
    return unsignSessionId(signedId, serverConfig);
  }
  return null;
}

/**
 * Handles the handshake request:
 * - Gets a session ID (from cookies, or generates it if doesn't exist)
 * - If a new session ID was generated, sets it as a new cookie
 * @param req
 * @param headers
 */
export function handleHandshakeHeaders(
  req: IncomingMessage,
  headers: string[],
  serverConfig: ServerConfig
) {
  let sessionId = getSessionIdFromCookies(req.headers["cookie"], serverConfig);
  if (!sessionId) {
    // Create a new session and set it as a new cookie
    sessionId = generateSessionId();
    const cookieEntry = `${sessionCookieKey}=${signSessionId(
      sessionId,
      serverConfig
    )}`;
    const { cookie } = serverConfig.session ?? {};

    headers.push(
      `Set-Cookie: ${[
        cookieEntry,
        (cookie?.secure ?? true) && "Secure",
        (cookie?.httpOnly ?? true) && "HttpOnly",
        collapse`Max-Age: ${cookie?.maxAge}`,
        collapse`Domain: ${cookie?.domain}`,
        collapse`Path: ${cookie?.path}`,
        collapse`Same-Site: ${cookie?.sameSite}`,
      ]
        .filter(Boolean)
        .join("; ")}`
    );
    // Add the session to the cookies for the current request
    req.headers["cookie"] += cookieEntry;
  }
}

/**
 * Sets given session store to be available in this module.
 * @param sessionStore Session store
 */
export function setSessionStore(sessionStore: Store) {
  store = sessionStore;
}

/**
 * Get current session object.
 * @returns Session
 */
export async function getSession() {
  if (!store) {
    throw new FlayerError("Session not configured");
  }
  return new Promise<Session>((resolve, reject) => {
    store.get(getSessionId(), (error, session) => {
      if (error) {
        return reject(error);
      }
      resolve(session);
    });
  });
  // return promisify(new MemoryStore().get)(getSessionId()) as Session;
}

/**
 * Set current session.
 * @param session Session
 */
export async function setSession(session: Session) {
  if (!store) {
    throw new FlayerError("Session not configured");
  }
  return new Promise<void>((resolve, reject) => {
    store.set(getSessionId(), session as any, (error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
}

/**
 * Destroy current session.
 */
export async function destroySession() {
  if (!store) {
    throw new FlayerError("Session not configured");
  }
  return new Promise<void>((resolve, reject) => {
    store.destroy(getSessionId(), (error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
}
