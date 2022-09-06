import { MemoryStore } from "express-session";
import { generatePackage } from "./codegen";
import {
  ClientPackageConfig,
  defaultClientPackageConfig,
  normalizeClientPackageConfig,
} from "./config/client-package-config";
import { defaultServerConfig, ServerConfig } from "./config/server-config";
import { FlayerError } from "./error";
import { logger } from "./logger";
import { getModuleMap, Modules, registerModules } from "./modules";
import { setSessionStore } from "./session";
import { startWebSocketServer } from "./websocket/server";

// Exposed library functions/interfaces
export { destroySession, getSession, Session, setSession } from "./session";
export { onDisconnect } from "./websocket/server";

/**
 * Creates a Flayer server object with provided modules.
 * @param modules Modules
 * @returns Flayer server
 */
export function createServer(modules: Modules) {
  registerModules(modules);

  logger.info(`\nFlayer modules:`);
  Array.from(getModuleMap().entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([moduleName, module]) => {
      console.log(`\n📦 "${moduleName}"`);
      Object.keys(module)
        .sort((a, b) => a.localeCompare(b))
        .forEach((functionName, index, array) => {
          const connector = index === array.length - 1 ? "└─" : "├─";
          console.log(`${connector} 🟢 ${functionName}`);
        });
    });

  return {
    /**
     * Starts the Flayer server.
     * @param config Flayer server configuration
     */
    async start(config: ServerConfig = defaultServerConfig) {
      // Validate session configuration if it exists
      if (config.session) {
        if (!config.session.secret) {
          throw new FlayerError("Session secret not defined");
        }
        if (!config.session.store) {
          // Use memory store by default, if store is not defined
          setSessionStore(config.session.store ?? new MemoryStore());
        }
      }

      startWebSocketServer(config);
    },
    /**
     * Generates client-side package for invoking Flayer functions.
     * @param config Client package configuration
     */
    async generatePackage(
      config: ClientPackageConfig = defaultClientPackageConfig
    ) {
      const start = Date.now();

      const normalizedConfig = normalizeClientPackageConfig(config);
      await generatePackage(normalizedConfig);

      logger.info(
        `\n🎁 Generated client package "${config.packageJson.name}" in ${(
          (Date.now() - start) /
          1000
        ).toFixed(3)} s`
      );
    },
  };
}
