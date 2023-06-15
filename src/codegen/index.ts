import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { resolve } from "path";
import {
  InterfaceDeclaration,
  ModuleDeclarationKind,
  SyntaxKind,
  TypeAliasDeclaration,
} from "ts-morph";
import {
  ClientPackageConfig,
  NormalizedClientPackageConfig,
} from "../config/client-package-config";
import { FlayerError } from "../error";
import { getModuleMap, Module } from "../modules";
import {
  assertModuleHasUniqueTypeNames,
  getProject,
  resolveFunction,
} from "../type-resolver";
import { mergeSets } from "../utils";

function generateJsFile(modulePath: string, functionNames: string[]) {
  return `import { executeFlayerFunction } from "flayer/client-lib/index.js";

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
  // Resolve each function into types and function declarations
  const resolvedFunctions = await Promise.all(
    Object.values(module).map(resolveFunction)
  );
  // Combine types into a single set
  const types = resolvedFunctions.reduce(
    (types, fn) => mergeSets(types, fn.typeDeclarations),
    new Set<InterfaceDeclaration | TypeAliasDeclaration>()
  );

  // Get declarations
  const declarationStructures = resolvedFunctions.map(
    (fn) => fn.declarationStructure
  );

  // Assert that the module only has unique type names
  assertModuleHasUniqueTypeNames(modulePath, types);

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
  const file = project.createSourceFile("index.d.ts", "", { overwrite: true });

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
    namedExports: ["configure", "disconnect"],
    // The actual types must be referred to under 'dist' instead of the bundle directory
    moduleSpecifier: "flayer/dist/client-lib",
  });

  // Read the pre-built lib files
  const clientLibPath = resolve(__dirname, "../../client-lib");
  const builtFiles = readdirSync(clientLibPath).map((fileName) => ({
    fileName,
    text: readFileSync(resolve(clientLibPath, fileName)).toString(),
  }));

  return {
    dts: file.getFullText(),
    builtFiles,
  };
}

/**
 * Generates package.json for the generated package
 * @param config Client package config
 * @param modulePaths Module paths (used for generating package entry points)
 * @returns Package.json contents
 */
function generatePackageJson(
  config: ClientPackageConfig,
  modulePaths: string[]
) {
  return JSON.stringify(
    {
      name: config.packageJson?.name,
      version: config.packageJson?.version,
      main: "index.js",
      type: "module",
      types: "index.d.ts",
      exports: {
        ".": "./index.js",
        // Generate a package entry point for every module
        ...modulePaths.reduce(
          (exports, modulePath) => ({
            ...exports,
            [`./${modulePath}`]: `./${modulePath}/index.js`,
          }),
          {}
        ),
      },
      scripts: {
        // This script is needed for the package to install its own dependencies on local npm install
        prepare: "npm install --ignore-scripts",
      },
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
  // TODO omaan funktioonsa ehkäpä
  // Clean up the package
  if (existsSync(config.path)) {
    // Check if the path is a directory
    if (lstatSync(config.path).isDirectory()) {
      // Delete all directories except node_modules (= Flayer modules)
      const directories = readdirSync(config.path, {
        withFileTypes: true,
      }).filter((file) => file.isDirectory);
      for (const { name } of directories) {
        if (name !== "node_modules") {
          rmSync(resolve(config.path, name), { recursive: true, force: true });
        }
      }
    } else {
      // Destination is not a directory
      throw new FlayerError(
        `Configured client package path ${config.path} exists but is not a directory. Please remove the file and try again.`
      );
    }
  }

  // Generate .d.ts & .js files for each module
  const files = await Promise.all(
    Array.from(getModuleMap().entries()).map(([modulePath, module]) => {
      return generateSourceFiles(modulePath, module);
    })
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

  const packageJson = generatePackageJson(config, modulePaths);
  writeFile(`${config.path}/package.json`, packageJson);
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
