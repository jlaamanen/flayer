import { sign, unsign } from "cookie-signature";
import { IncomingMessage } from "http";
import UID from "uid-safe";
import { getSessionId } from "./async-store";
import { ServerConfig } from "./config/server-config";
import { createSessionStore } from "./session-store";
import { collapse } from "./utils";

const sessionCookieKey = "flayer-session";
export const sessionStore = createSessionStore();

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
  console.log("req cookies", req.headers["cookie"]);
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
  if (!sessionStore.get(sessionId)) {
    // Create an empty object as the new session if doesn't yet exist
    sessionStore.set(sessionId, {});
  }
}

/**
 * Gets current session object
 * @returns Session
 */
export function getSession() {
  // TODO throw error if session not configured
  // TODO what about 'null' or false session ID?
  return sessionStore.get(getSessionId());
}

/**
 * Sets current session
 */
export function setSession(session: Session) {
  // TODO throw error if session not configured
  sessionStore.set(getSessionId(), session);
}

/**
 * Destroys current session
 */
export function destroySession() {
  // TODO throw error if session not configured
  sessionStore.destroy(getSessionId());
}
