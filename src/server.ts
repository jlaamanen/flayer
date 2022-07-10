import { WebSocketServer } from "ws";
import { generatePackage } from "./codegen";
import {
  ClientPackageConfig,
  defaultClientPackageConfig,
  normalizeClientPackageConfig,
} from "./config/client-package-config";
import {
  defaultServerConfig,
  normalizeServerConfig,
  ServerConfig,
} from "./config/server-config";
import { runWithAsyncStore } from "./context";
import { logger } from "./logger";
import { handleInvocationMessage, parseMessage } from "./message";
import { Modules, registerModules } from "./modules";
export { resolveFunction as resolve } from "./type-resolver";

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
      const { port } = await normalizeServerConfig(config);
      const wss = new WebSocketServer({
        port,
      });
      wss.on("connection", (ws, req) => {
        console.log("Connection established with a client");
        ws.on("message", async (rawMessage) => {
          // The messages handled here should only be invocation messages.
          const message = parseMessage(rawMessage.toString(), ws);
          if (!message || message.type !== "invocation") {
            // Ignore non-invocation messages here - callbacks are handled in their own listeners
            return;
          }
          // Make the context globally available within the invocation lifetime
          runWithAsyncStore({ context: message.context, ws }, async () => {
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
