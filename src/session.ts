import { IncomingMessage } from "http";
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
  // TODO something more secure
  return Math.random().toString(36).substring(2);
}

/**
 * Tries to parse a session ID from cookies.
 * If not found, generates a new ID.
 * @param cookies
 */
export function getSessionIdFromCookies(cookies: string) {
  const sessionId = cookies
    ?.split(";")
    .find((cookie) => cookie.startsWith(sessionCookieKey));
  if (sessionId) {
    return sessionId.split("=")[1];
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
  let sessionId = getSessionIdFromCookies(req.headers["cookie"]);
  if (!sessionId) {
    // Create a new session and set it as a new cookie
    sessionId = generateSessionId();
    const cookieEntry = `${sessionCookieKey}=${sessionId}`;
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
  return sessionStore.get(getSessionId());
}

/**
 * Sets current session
 */
export function setSession(session: Session) {
  sessionStore.set(getSessionId(), session);
}

/**
 * Destroys current session
 */
export function destroySession() {
  sessionStore.destroy(getSessionId());
}
