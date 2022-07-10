import { build } from "esbuild";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import {
  InterfaceDeclaration,
  ModuleDeclarationKind,
  SyntaxKind,
  TypeAliasDeclaration,
} from "ts-morph";
import { NormalizedClientPackageConfig } from "../config/client-package-config";
import { logger } from "../logger";
import { getModuleMap, Module } from "../modules";
import { getProject, resolveFunction } from "../type-resolver";
import { mergeSets } from "../utils";

function generateJsFile(modulePath: string, functionNames: string[]) {
  return `const { executeFlayerFunction } = require("flayer/dist/lib");

${functionNames
  .map(
    (name) =>
      `export async function ${name}(...args) { return executeFlayerFunction("${modulePath}", "${name}", args); };`
  )
  .join("\n")}`;
}

/**
 * Generate source filed (.js and .d.ts) for the given module.
 * @param modulePath Module path
 * @param module Module object
 * @returns Generated source files
 */
async function generateSourceFiles(modulePath: string, module: Module) {
  const start = Date.now();
  // Resolve each function into types and function declarations
  const resolvedFunctions = await Promise.all(
    Object.values(module).map(resolveFunction)
  );
  // Combine types into a single set
  const types = resolvedFunctions.reduce(
    (types, fn) => mergeSets(types, fn.typeDeclarations),
    new Set<InterfaceDeclaration | TypeAliasDeclaration>()
  );

  console.log(`resolved functions in ${Date.now() - start}ms`);
  // Get declarations
  const declarationStructures = resolvedFunctions.map(
    (fn) => fn.declarationStructure
  );

  // Assert that the module only has unique type names
  // TODO type Set doesn't always work! (the same declaration may appear there multiple times)
  // assertModuleHasUniqueTypeNames(modulePath, types);

  const project = getProject();

  const file = project.createSourceFile(`${modulePath}.d.ts`);

  // Add the functions to the file
  file.addFunctions(declarationStructures);

  // Add each type to the source file
  Array.from(types).forEach((declaration) => {
    switch (declaration.getKind()) {
      case SyntaxKind.InterfaceDeclaration:
        file.addInterface((declaration as InterfaceDeclaration).getStructure());
        break;
      case SyntaxKind.TypeAliasDeclaration:
        file.addTypeAlias((declaration as TypeAliasDeclaration).getStructure());
        break;
      default:
        break;
    }
  });

  return {
    modulePath,
    dts: file.getFullText(),
    js: generateJsFile(modulePath, Object.keys(module)),
  };
}

/**
 * Generates the index source file for the package entry point
 * @param packageName Package name
 * @param modulePaths Module paths
 * @returns Index source file
 */
export async function generateModuleIndex(
  packageName: string,
  modulePaths: string[]
) {
  const project = getProject();
  const file = project.createSourceFile("index.d.ts");

  // Add triple-slash references to each module (makes IntelliSense work better)
  file.addStatements(
    modulePaths.map(
      (modulePath) => `/// <reference path="./${modulePath}/index.d.ts" />`
    )
  );

  // Declare a module for the built-in functions
  const moduleDeclaration = file.addModule({
    name: `"${packageName}"`,
    declarationKind: ModuleDeclarationKind.Module,
    hasDeclareKeyword: true,
  });

  moduleDeclaration.addExportDeclaration({
    namedExports: ["configure", "getContext"],
    moduleSpecifier: "flayer/dist/lib",
  });

  // Build with the lib index as entry point
  const builtFiles = await build({
    entryPoints: [resolve(__dirname, "../../src/lib/index.ts")],
    bundle: true,
    outdir: "temp",
    sourcemap: true,
    minify: true,
    splitting: true,
    format: "esm",
    target: "esnext",
    write: false,
  }).then(({ outputFiles }) => {
    return outputFiles.map((file) => ({
      fileName: file.path.slice(
        file.path.lastIndexOf("temp/") + "temp/".length
      ),
      text: file.text,
    }));
  });

  return {
    dts: file.getFullText(),
    builtFiles,
  };
}

/**
 * Generates package.json for the generated package
 * @param config Client package config
 * @returns Package.json contents
 */
function generatePackageJson(config: NormalizedClientPackageConfig) {
  return JSON.stringify(
    {
      name: config.packageJson.name,
      version: config.packageJson.version,
      main: "index.js",
      types: "index.d.ts",
      dependencies: {
        flayer: config.flayerVersion,
      },
    },
    null,
    2
  );
}

/**
 * Generates the entire client package with given configuration.
 * @param config Client package configuration
 */
export async function generatePackage(config: NormalizedClientPackageConfig) {
  const start = Date.now();
  logger.info("Generating client package with config", config);

  // Generate .d.ts & .js files for each module
  const files = await Promise.all(
    Array.from(getModuleMap().entries()).map(([modulePath, module]) =>
      generateSourceFiles(modulePath, module)
    )
  );

  files.forEach((file) => {
    writeFile(`${resolve(config.path, file.modulePath)}/index.d.ts`, file.dts);
    writeFile(`${resolve(config.path, file.modulePath)}/index.js`, file.js);
  });

  // Generate index.d.ts for the package entry point
  const modulePaths = Array.from(getModuleMap().keys());
  const moduleIndex = await generateModuleIndex(
    config.packageJson.name,
    modulePaths
  );
  writeFile(`${config.path}/index.d.ts`, moduleIndex.dts);
  moduleIndex.builtFiles.forEach((file) => {
    writeFile(`${config.path}/${file.fileName}`, file.text);
  });
  // writeFile(`${config.path}/index.js`, moduleIndex.js);

  const packageJson = generatePackageJson(config);
  writeFile(`${config.path}/package.json`, packageJson);

  console.log(`generated packages in ${Date.now() - start}ms`);
}

/**
 * Write given file to disk. If the path of the file doesn't exist, create it.
 * @param path
 * @param content
 */
export function writeFile(path: string, content: string) {
  const dir = path.split("/").slice(0, -1).join("/");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, content);
}
