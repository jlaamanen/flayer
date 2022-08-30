import { WebSocketServer } from "ws";
import { runWithAsyncStore } from "./async-store";
import { generatePackage } from "./codegen";
import {
  ClientPackageConfig,
  defaultClientPackageConfig,
  normalizeClientPackageConfig,
} from "./config/client-package-config";
import { defaultServerConfig, ServerConfig } from "./config/server-config";
import { logger } from "./logger";
import { handleInvocationMessage, parseMessage } from "./message";
import { Modules, registerModules } from "./modules";
import { getSessionIdFromCookies, handleHandshakeHeaders } from "./session";

export { destroySession, getSession, Session, setSession } from "./session";
export { resolveFunction as resolve } from "./type-resolver";

const defaultPort = 1234;

/**
 * Creates a Flayer server object with provided modules.
 * @param modules Modules
 * @returns Flayer server
 */
export function createServer(modules: Modules) {
  registerModules(modules);
  return {
    /**
     * Starts the Flayer server.
     * @param config Flayer server configuration
     */
    async start(config: ServerConfig = defaultServerConfig) {
      const port = config.port ?? defaultPort;
      // TODO move WS server configuration to websocket/server.ts
      const wss = new WebSocketServer({
        port,
      });
      wss.on("headers", (headers, req) => {
        handleHandshakeHeaders(req, headers, config);
      });
      wss.on("connection", (ws, req) => {
        const sessionId = getSessionIdFromCookies(
          req.headers["cookie"],
          config
        );
        ws.on("message", async (rawMessage) => {
          // The messages handled here should only be invocation messages.
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
    },
    /**
     * Generates client-side package for invoking Flayer functions.
     * @param config Client package configuration
     */
    async generatePackage(
      config: ClientPackageConfig = defaultClientPackageConfig
    ) {
      const normalizedConfig = normalizeClientPackageConfig(config);
      await generatePackage(normalizedConfig);
    },
  };
}
