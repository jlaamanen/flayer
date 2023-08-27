import { MemoryStore } from "express-session";
import { WebSocketServer } from "ws";
import { generatePackage } from "./codegen";
import {
  ClientPackageConfig,
  normalizeClientPackageConfig,
} from "./config/client-package-config";
import { ServerConfig, normalizeServerConfig } from "./config/server-config";
import { FlayerError } from "./error";
import { logger } from "./logger";
import { Modules, getModuleMap, registerModules } from "./modules";
import { setSessionStore } from "./session";
import { startWebSocketServer } from "./websocket/server";

// Exposed library functions/interfaces
export { Session, destroySession, getSession, setSession } from "./session";
export { onDisconnect } from "./websocket/server";

let wss: WebSocketServer | null = null;

/**
 * Creates a Flayer server object with provided modules.
 * @param modules Modules
 * @returns Flayer server
 */
export function createServer(modules: Modules) {
  registerModules(modules);

  logger.info("");
  logger.info(`Flayer modules:`);
  // Log all modules and their functions
  Array.from(getModuleMap().entries()).forEach(([moduleName, module]) => {
    logger.info("");
    logger.info(`📦 "${moduleName}"`);
    Object.keys(module).forEach((functionName, index, array) => {
      const connector = index === array.length - 1 ? "└─" : "├─";
      logger.info(`${connector} 🟢 ${functionName}`);
    });
  });

  return {
    /**
     * Starts the Flayer server.
     * @param config Flayer server configuration
     */
    async start(config?: ServerConfig) {
      const normalizedConfig = normalizeServerConfig(config);
      // Validate session configuration if it exists
      if (normalizedConfig.session) {
        if (!normalizedConfig.session.secret) {
          throw new FlayerError("Session secret not defined");
        }
        if (!normalizedConfig.session.store) {
          // Use memory store by default, if store is not defined
          setSessionStore(normalizedConfig.session.store ?? new MemoryStore());
        }
      }

      wss?.close();
      wss = startWebSocketServer(normalizedConfig);
    },
    /**
     * Stops the Flayer server.
     */
    stop() {
      wss?.close();
    },
    /**
     * Generates client-side package for invoking Flayer functions.
     * @param config Client package configuration
     */
    async generatePackage(config?: ClientPackageConfig) {
      const start = Date.now();

      const normalizedConfig = normalizeClientPackageConfig(config);
      await generatePackage(normalizedConfig);

      logger.info("");
      logger.info(
        `🎁 Generated client package "${normalizedConfig.packageName}" in ${(
          (Date.now() - start) /
          1000
        ).toFixed(3)} s`
      );
    },
  };
}
