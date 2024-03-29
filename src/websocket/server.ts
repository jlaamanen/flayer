import { WebSocketServer } from "ws";
import { getWebSocket, runWithAsyncStore } from "../async-store";
import { NormalizedServerConfig } from "../config/server-config";
import { logger } from "../logger";
import { handleInvocationMessage, parseMessage } from "../message";
import { getSessionIdFromCookies, handleHandshakeHeaders } from "../session";

const defaultPort = 1234;

/**
 * Starts Flayer WebSocket server.
 * @param config Server configuration
 */
export function startWebSocketServer(config: NormalizedServerConfig) {
  const port = config.port ?? defaultPort;

  // Use given HTTP server if provided, otherwise start a new one in the configured port
  const wss = new WebSocketServer(
    config.server != null
      ? {
          server: config.server,
        }
      : {
          port,
        }
  );

  // If an onRequest handler is set, make the WS server forward requests there
  if (config.onRequest != null) {
    wss.on("request", config.onRequest);
  }

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

    // Set event listener limit
    ws.setMaxListeners(config.maxListeners ?? 0);

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

  logger.info("");
  if (config.server != null) {
    logger.info(`Flayer started`);
  } else {
    logger.info(`Flayer started on port ${port}`);
  }

  return wss;
}

/**
 * Add a callback that gets executed when the connection is closed.
 * @param callback Callback function
 */
export function onDisconnect(callback: () => void) {
  getWebSocket().on("close", callback);
}
