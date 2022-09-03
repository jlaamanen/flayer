import { WebSocketServer } from "ws";
import { runWithAsyncStore } from "../async-store";
import { ServerConfig } from "../config/server-config";
import { logger } from "../logger";
import { handleInvocationMessage, parseMessage } from "../message";
import { getSessionIdFromCookies, handleHandshakeHeaders } from "../session";

const defaultPort = 1234;

/**
 * Starts Flayer WebSocket server.
 * @param config Server configuration
 */
export function startWwbSocketServer(config: ServerConfig) {
  const port = config.port ?? defaultPort;

  const wss = new WebSocketServer({
    port,
  });

  // Intercept handshake request when about to send headers
  wss.on("headers", (headers, req) => {
    if (config.session) {
      // Handle session specific headers (set-cookie) if needed
      handleHandshakeHeaders(req, headers, config);
    }
  });

  // Handle incoming connections
  wss.on("connection", (ws, req) => {
    const sessionId = config.session
      ? getSessionIdFromCookies(req.headers["cookie"], config)
      : null;

    // Handle incoming messages
    ws.on("message", async (rawMessage) => {
      const message = parseMessage(rawMessage.toString(), ws);
      if (!message || message.type !== "invocation") {
        // Ignore non-invocation messages here - callbacks are handled in their own listeners
        return;
      }
      // Make session ID and WS connection globally available within each execution context
      runWithAsyncStore({ sessionId, ws }, async () => {
        await handleInvocationMessage(message, ws);
      });
    });
  });

  logger.info(`Started Flayer server on port ${port}`);
}
