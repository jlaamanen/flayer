import { FlayerError } from "./error";

/**
 * Single module contents
 */
export interface Module {
  [functionName: string]: (...args: any) => any;
}

export type FunctionOrSubmodule =
  | { [name: string]: FunctionOrSubmodule }
  | ((...args: any) => any);

/**
 * Recursive module object
 */
export interface Modules {
  [moduleName: string]: {
    [functionOrSubmoduleName: string]: FunctionOrSubmodule;
  };
}

/**
 * Internal module map
 * Key: module path, value: functions
 */
type ModuleMap = Map<string, Module>;

/**
 * Module map
 */
let moduleMap: ModuleMap | null = null;

/**
 * Gets a function from server modules by traversing the module tree with
 * given path.
 */
export function getFunction(modulePath: string, functionName: string) {
  if (!moduleMap) {
    throw new Error("Modules not registered");
  }

  const module = moduleMap.get(modulePath);
  if (!module) {
    throw new Error(`Module "${modulePath}" not found`);
  }
  const fn = module[functionName];
  if (!fn) {
    throw new Error(
      `Function "${functionName}" not found in module "${modulePath}"`
    );
  }
  return fn;
}

/**
 * Flattens nested module object into a flat module map.
 * @param module Module/modules
 * @param map Map
 * @param pathSegments Current path segments
 * @returns Flat module map
 */
function flattenModules(
  module: FunctionOrSubmodule,
  map: ModuleMap = new Map(),
  pathSegments: string[] = []
) {
  Object.keys(module).forEach((key) => {
    const path = [...pathSegments].join("/");
    const item = module[key as keyof typeof module] as FunctionOrSubmodule;
    if (typeof item === "function") {
      // Item is a function - add it to the map
      map.set(path, {
        ...(map.get(path) ?? {}),
        [key]: item,
      });
    } else {
      // Item is a module - go deeper into the tree
      map = flattenModules(item, map, [...pathSegments, key]);
    }
  });
  return map;
}

export function getModuleMap() {
  if (!moduleMap) {
    throw new FlayerError("Modules not registered");
  }
  return moduleMap;
}

/**
 * Registers given modules.
 * @param modules Modules
 */
export function registerModules(modules: Modules) {
  moduleMap = flattenModules(modules);
}
