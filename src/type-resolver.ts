import { locate } from "func-loc";
import { SourceMapConsumer } from "source-map";
import {
  ArrowFunction,
  FunctionDeclaration,
  FunctionDeclarationStructure,
  FunctionExpression,
  InterfaceDeclaration,
  JSDoc,
  MethodDeclaration,
  Node,
  OptionalKind,
  Project,
  ProjectOptions,
  SourceFile,
  SyntaxKind,
  Type,
  TypeAliasDeclaration,
  ts,
} from "ts-morph";
import { FlayerError } from "./error";

export interface ResolvedFunction {
  declarationStructure: FunctionDeclarationStructure;
  typeDeclarations: Set<InterfaceDeclaration>;
}

const NodeFlagAmbient = 8388608;

// Cache the project for performance
let project: Project | null = null;

type FunctionNode =
  | FunctionDeclaration
  | FunctionExpression
  | ArrowFunction
  | MethodDeclaration;

function getPosForLineAndColumn(
  sourceFile: SourceFile,
  line: number,
  column: number
) {
  // This works also for CRLF, because each \r just adds one more to the position
  const lines = sourceFile.getFullText().split("\n");
  // Line numbers start from 1
  const previousLines = lines.slice(0, line - 1);
  // Some weird bug in func-loc puts the function a bit off sometimes.
  // Add 2 to be secure - it should still be inside the function, and that's all that matters.
  return previousLines.join(",").length + column + 2;
}

function getFunctionNode(sourceFile: SourceFile, position: number) {
  // TODO caching?
  // Try to find some function declaration/expression or arrow function that contains given position
  const nodes = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionExpression),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
  ];
  return nodes.find((node) => node.containsRange(position, position));
}

export function getProject(options: ProjectOptions = {}) {
  // If project is not found in cache, create one
  if (!project) {
    const tsConfigFilePath =
      ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json") ??
      "./tsconfig.json";
    project = new Project({
      tsConfigFilePath,
      ...(options ?? {}),
    });
  }
  return project;
}

/**
 * Gets an InterfaceDeclaration or a TypeAliasDeclaration for the given type
 * if the type is "custom".
 *
 * Returns null for primitive or built-in types.
 *
 * @param type Type
 * @returns Type declaration
 */
function getCustomTypeDeclaration(type: Type) {
  const symbol = type.getSymbol() ?? type.getAliasSymbol();
  if (!symbol) {
    // Primitive types don't have a symbol
    return null;
  }

  return (
    symbol.getDeclarations().find(
      (
        declaration
      ): declaration is InterfaceDeclaration | TypeAliasDeclaration =>
        // Only pick ambient types (.d.ts) if they're inside the project
        (declaration.getFlags() & NodeFlagAmbient ||
          (declaration.getSourceFile() as any)._inProject) &&
        [
          SyntaxKind.InterfaceDeclaration,
          SyntaxKind.TypeAliasDeclaration,
        ].includes(declaration.getKind())
    ) ?? null
  );
}

function getCustomTypesInNode(node: Node) {
  const types = new Set<Type>();
  node.forEachDescendant((descendant) => {
    if (descendant.getSymbol() === node.getSymbol()) {
      // Ignore self-references
      return;
    }
    if (Node.isTypeNode(descendant) || Node.isIdentifier(descendant)) {
      types.add(descendant.getType());
    } else if (Node.isReturnTyped(descendant)) {
      types.add(descendant.getReturnType());
    }
  });
  return Array.from(types);
}

function resolveTypeDeclarationsForTypes(
  types: Type[],
  typeDeclarations = new Set<InterfaceDeclaration | TypeAliasDeclaration>()
) {
  for (const type of types) {
    // const debug = type.getText().includes("import");
    const declarations = [
      getCustomTypeDeclaration(type),
      ...type.getTypeArguments().map(getCustomTypeDeclaration),
    ].filter(
      (declaration) => declaration && !typeDeclarations.has(declaration)
    );

    if (!declarations.length) {
      continue;
    }

    const subTypes = declarations.reduce((subTypes, declaration) => {
      if (!declaration) {
        return subTypes;
      }
      // Add the declaration to the set as well
      typeDeclarations.add(declaration);
      return [...subTypes, ...getCustomTypesInNode(declaration)];
    }, [] as Type[]);

    // const subTypes = getCustomTypesInNode(declaration);
    typeDeclarations = resolveTypeDeclarationsForTypes(
      subTypes,
      typeDeclarations
    );
  }

  return typeDeclarations;
}

export function resolveTypeDeclarationsForFunctionNode(node: FunctionNode) {
  const signature = node.getSignature();
  const types = [
    ...signature
      .getParameters()
      .reduce(
        (types, parameter) => [
          ...types,
          ...parameter.getDeclarations().map((d) => d.getType()),
        ],
        [] as Type[]
      ),
    signature.getReturnType(),
    ...signature.getTypeParameters(),
  ];

  return resolveTypeDeclarationsForTypes(types);
}

function promisifyTypeAsText(type: string) {
  return /^Promise<.*>$/.test(type) ? type : `Promise<${type}>`;
}

function getJsDocs(node: FunctionNode) {
  // JSDocs should be available directly in the node for function declarations
  if (
    node.getKind() === SyntaxKind.FunctionDeclaration ||
    node.getKind() === SyntaxKind.MethodDeclaration
  ) {
    return (node as FunctionDeclaration)
      .getJsDocs()
      ?.map((docs) => docs.getStructure());
  }
  // For function expressions, JSDocs should be up two levels
  if (node.getParentIfKind(SyntaxKind.VariableDeclaration)) {
    return (
      node
        .getParentIfKind(SyntaxKind.VariableDeclaration)
        ?.getParentIfKind(SyntaxKind.VariableDeclarationList)
        ?.getParentIfKind(SyntaxKind.VariableStatement)
        ?.getJsDocs()
        ?.map((docs) => docs.getStructure()) ?? []
    );
  }
  // For property assignments, the JSDocs should be in the parent.
  if (node.getParentIfKind(SyntaxKind.PropertyAssignment)) {
    // TODO: ts-morph doesn't think PropertyAssignment is JSDocable, so we're abusing the internal functions here!
    const parentNode = node.getParentIfKind(SyntaxKind.PropertyAssignment);
    const jsDocsNodes: Node[] = (parentNode?.compilerNode as any).jsDoc;
    return (
      jsDocsNodes?.map((node) =>
        (parentNode as any)["_getNodeFromCompilerNode" as any](node)
      ) as JSDoc[]
    )?.map((docs) => docs.getStructure());
  }
  // Old-school JS module.exports may have JSDocs a couple steps further up
  if (
    node
      .getParentIfKind(SyntaxKind.BinaryExpression)
      ?.getParentIfKind(SyntaxKind.ExpressionStatement)
  ) {
    const parentNode = node
      ?.getParentIfKind(SyntaxKind.BinaryExpression)
      ?.getParentIfKind(SyntaxKind.ExpressionStatement);
    return parentNode?.getJsDocs()?.map((docs) => docs.getStructure()) ?? [];
  }
}

export function getFunctionDeclarationStructure(
  node: FunctionNode
): OptionalKind<FunctionDeclarationStructure> {
  // Try to get function name from the node first - otherwise it should be in the parent
  const name =
    node.getSymbol()?.getName() ??
    node.compilerNode.name?.getText() ??
    node.getParentIfKind(SyntaxKind.VariableDeclaration)?.getName() ??
    node.getParentIfKind(SyntaxKind.PropertyAssignment)?.getName();

  if (!name) {
    throw new Error("Could not deduce name for a function");
  }

  let returnType: string | null = null;
  try {
    // If some imported type is returned, get the text via node to get rid of "import" types -
    // otherwise it should be a primitive type
    returnType =
      node.getReturnTypeNode()?.getText() ?? node.getReturnType().getText(node);
  } catch (error) {
    // For JS files getReturnType seems to throw an error - just fallback to `any` in this case
    returnType = "any";
  }

  return {
    name,
    parameters: node
      .getParameters()
      .map((parameter) => parameter.getStructure()),
    typeParameters: node
      .getTypeParameters()
      .map((parameter) => parameter.getStructure()),
    // Make return type a Promise (unless it already is one)
    returnType: promisifyTypeAsText(returnType),
    // The declaration should not be async, even though the function actually is
    isAsync: false,
    docs: getJsDocs(node),
    isExported: true,
  };
}

function getDuplicateTypeNames(
  types: Set<InterfaceDeclaration | TypeAliasDeclaration>
) {
  const uniqueNames = Array.from(
    new Set(Array.from(types).map((type) => type.getSymbol()?.getName()))
  );
  return uniqueNames.filter(
    (name) =>
      Array.from(types).filter((type) => name === type.getSymbol()?.getName())
        .length !== 1
  );
}

function assertFunctionHasUniqueTypeNames(
  functionName: string,
  types: Set<InterfaceDeclaration | TypeAliasDeclaration>
) {
  const duplicates = getDuplicateTypeNames(types);
  if (duplicates.length > 0) {
    throw new Error(
      `Function "${functionName}" has types of duplicate name: ${duplicates
        .map((name) => `"${name}"`)
        .join(", ")}`
    );
  }
}

export function assertModuleHasUniqueTypeNames(
  modulePath: string,
  types: Set<InterfaceDeclaration | TypeAliasDeclaration>
) {
  const duplicates = getDuplicateTypeNames(types);
  if (duplicates.length > 0) {
    throw new Error(
      `Module "${modulePath}" has types of duplicate name: ${duplicates
        .map((name) => `"${name}"`)
        .join(", ")}`
    );
  }
}

/**
 * Resolve given function into a function declaration structure and type declarations.
 * @param fn Function
 * @returns Function declaration structure and type declarations
 */
export async function resolveFunction(fn: (...args: any[]) => any) {
  if (typeof fn !== "function") {
    throw new Error("Expected a function");
  }
  let { path, line, column } = await locate(fn, { sourceMap: true });
  const project = getProject();
  // Clear any existing source files
  project.getSourceFiles().map(project.removeSourceFile);

  // If the path wasn't included in files, add it to the project (e.g. .js files)
  let sourceFile =
    project.getSourceFile(path) ?? project.addSourceFileAtPath(path);

  // In case the file contains a source map, use it to correct the position
  const sourceMapLine = sourceFile
    .getText()
    .split(/\n/)
    .find((line) => line.startsWith("//# sourceMappingURL"));

  if (sourceMapLine) {
    const [, data] = sourceMapLine.split("data:application/json;base64,");
    const sourceMap = JSON.parse(Buffer.from(data, "base64").toString());
    await SourceMapConsumer.with(sourceMap, null, (consumer) => {
      const originalPosition = consumer.originalPositionFor({ line, column });
      if (
        originalPosition.source &&
        originalPosition.line != null &&
        originalPosition.column != null
      ) {
        path = originalPosition.source;
        sourceFile =
          project.getSourceFile(path) ?? project.addSourceFileAtPath(path);
        line = originalPosition.line;
        column = originalPosition.column;
      }
    });
  }

  const position = getPosForLineAndColumn(sourceFile, line, column);
  const node = getFunctionNode(sourceFile, position);

  if (!node) {
    throw new FlayerError("Could not find function node");
  }
  // Prepare & unify the function declaration for codegen
  const declarationStructure = getFunctionDeclarationStructure(node);

  if (!declarationStructure.name) {
    throw new FlayerError("Function declaration is unnamed");
  }

  // Set the return type explicitly
  const returnType = node.getReturnType();
  node.setReturnType(returnType.getText());
  const typeDeclarations = resolveTypeDeclarationsForFunctionNode(node);

  // Each function must have unique named types for now
  assertFunctionHasUniqueTypeNames(declarationStructure.name, typeDeclarations);

  return {
    declarationStructure,
    typeDeclarations,
  } as ResolvedFunction;
}
