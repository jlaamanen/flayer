import { PartialDeep } from "type-fest";

/**
 * Normalized client package configuration.
 *
 * For internal use.
 */
export interface NormalizedClientPackageConfig {
  /**
   * Path of the generated client package.
   *
   * @default "./.flayer"
   */
  path: string;
  /**
   * Flayer version to use in the generated client package
   *
   * @default Currently installed Flayer version
   */
  flayerVersion: string;
  /**
   * Generated package.json overrides.
   */
  packageJson: {
    /**
     * Package name
     */
    name: string;
    /**
     * Package version
     */
    version: string;
  };
}

/**
 * Flayer client configuration.
 */
export type ClientPackageConfig = PartialDeep<NormalizedClientPackageConfig>;

export const defaultClientPackageConfig: NormalizedClientPackageConfig = {
  path: "./.flayer",
  // Get current package version from package.json
  flayerVersion: require("../../package.json").version,
  packageJson: {
    name: "server-pkg",
    version: "0.0.1",
  },
};

/**
 * Normalizes given partial client configuration.
 *
 * Fills the values with the following order:
 * 1. environment
 * 2. configuration given as an argument
 * 3. default values
 * @param config Partial client configuration
 * @returns Normalized client configuration
 */
export function normalizeClientPackageConfig(
  config: ClientPackageConfig
): NormalizedClientPackageConfig {
  return {
    path:
      process.env.FLAYER_CLIENT_PATH ??
      config.path ??
      defaultClientPackageConfig.path,
    flayerVersion:
      process.env.FLAYER_CLIENT_FLAYER_VERSION ??
      config.flayerVersion ??
      defaultClientPackageConfig.flayerVersion,
    packageJson: {
      ...defaultClientPackageConfig.packageJson,
      ...config.packageJson,
    },
  };
}
