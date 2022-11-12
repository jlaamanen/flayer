import { sign, unsign } from "cookie-signature";
import { Store } from "express-session";
import { IncomingMessage } from "http";
import UID from "uid-safe";
import { getSessionId } from "./async-store";
import { NormalizedServerConfig } from "./config/server-config";
import { FlayerConfigError, FlayerError } from "./error";
import { collapse } from "./utils";

const sessionCookieKey = "flayer-session";
let store: Store | null = null;

export interface Session {}

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
function signSessionId(
  sessionId: string,
  serverConfig: NormalizedServerConfig
) {
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
function unsignSessionId(
  signedSessionId: string,
  serverConfig: NormalizedServerConfig
) {
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
  cookies: string | undefined,
  serverConfig: NormalizedServerConfig
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
  serverConfig: NormalizedServerConfig
) {
  let sessionId = getSessionIdFromCookies(req.headers["cookie"], serverConfig);
  if (!sessionId) {
    // Create a new session and set it as a new cookie
    sessionId = generateSessionId();
    const cookieEntry = `${sessionCookieKey}=${signSessionId(
      sessionId,
      serverConfig
    )}`;
    const { cookie } = serverConfig.session;

    headers.push(
      `Set-Cookie: ${[
        cookieEntry,
        cookie.secure && "Secure",
        cookie.httpOnly && "HttpOnly",
        collapse`Max-Age: ${cookie.maxAge}`,
        collapse`Domain: ${cookie.domain}`,
        collapse`Path: ${cookie.path}`,
        collapse`Same-Site: ${cookie.sameSite}`,
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
 * Assures that the session store is defined, otherwise throws an error.
 */
function assertStoreIsDefined() {
  if (!store) {
    throw new FlayerConfigError("Session not configured");
  }
}

/**
 * Tries to get the current session ID from async local storage.
 *
 * If not found, throws an error.
 * @returns Session ID for the current connection
 */
function getSessionIdFromAsyncStore() {
  const sessionId = getSessionId();
  if (sessionId == null) {
    throw new FlayerError("Session ID not found for the current connection");
  }
  return sessionId;
}

/**
 * Get current session object.
 * @returns Session
 */
export async function getSession() {
  return new Promise<Session | null>((resolve, reject) => {
    assertStoreIsDefined();
    store!.get(getSessionIdFromAsyncStore(), (error, session) => {
      if (error) {
        return reject(error);
      }
      resolve(session ?? null);
    });
  });
  // return promisify(new MemoryStore().get)(getSessionId()) as Session;
}

/**
 * Set current session.
 * @param session Session
 */
export async function setSession(session: Session) {
  return new Promise<void>((resolve, reject) => {
    assertStoreIsDefined();
    store!.set(getSessionIdFromAsyncStore(), session as any, (error) => {
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
  return new Promise<void>((resolve, reject) => {
    assertStoreIsDefined();
    store!.destroy(getSessionIdFromAsyncStore(), (error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
}
