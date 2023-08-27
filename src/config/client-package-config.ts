import { DeepRequired } from "../utils";

/**
 * Flayer client package configuration.
 */
export interface ClientPackageConfig {
  /**
   * Path of the generated client package.
   *
   * @default "./.flayer"
   */
  path?: string;
  /**
   * Flayer version to use in the generated client package
   *
   * @default Currently installed Flayer version
   */
  flayerVersion?: string;
  /**
   * Package name
   *
   * @default "server-pkg"
   */
  packageName?: string;
  /**
   * Package version
   *
   * @default "0.0.1"
   */
  packageVersion?: string;
}

/**
 * Client package config with all fields filled.
 *
 * For internal use only.
 */
export type NormalizedClientPackageConfig = DeepRequired<ClientPackageConfig>;

/**
 * Fills user-given client package config with default values unless provided.
 * @param config User-given config
 * @returns Normalized config
 */
export function normalizeClientPackageConfig(
  config: ClientPackageConfig | undefined
): NormalizedClientPackageConfig {
  return {
    path: config?.path ?? "./.flayer",
    // Get current package version from package.json
    flayerVersion:
      config?.flayerVersion ?? require("../../package.json").version,
    packageName: config?.packageName ?? "server-pkg",
    packageVersion: config?.packageVersion ?? "0.0.1",
  };
}
