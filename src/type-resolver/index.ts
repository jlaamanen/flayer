import { locate } from "func-loc";
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
} from "ts-morph";
import { Service } from "ts-node";

export interface ResolvedFunction {
  declarationStructure: FunctionDeclarationStructure;
  typeDeclarations: Set<InterfaceDeclaration>;
}

const NodeFlagAmbient = 8388608;

// Cache the project for performance
let project: Project = null;

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
    const service = process[require("ts-node").REGISTER_INSTANCE] as Service;
    project = new Project({
      tsConfigFilePath: (service as any).configFilePath,
      ...(options ?? {}),
    });
  }
  return project;
}

/**
 * Gets an InterfaceDeclaration or a TypeAliasDeclaration for the given type
 * if the type is "custom".
 *
 * Returns null for primitive or built-in/ambient types.
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
    symbol
      .getDeclarations()
      .find(
        (
          declaration
        ): declaration is InterfaceDeclaration | TypeAliasDeclaration =>
          !(declaration.getFlags() & NodeFlagAmbient) &&
          [
            SyntaxKind.InterfaceDeclaration,
            SyntaxKind.TypeAliasDeclaration,
          ].includes(declaration.getKind())
      ) ?? null
  );
}

/**
 * Gets all "custom" types under the given node.
 * @param node Node
 * @returns Custom types used in the node
 */
function getCustomTypeDeclarationsInNode(node: Node) {
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
  return Array.from<Type>(types).map(getCustomTypeDeclaration).filter(Boolean);
}

function recursivelyGetTypeDeclarationsInNode(
  node: Node,
  typeDeclarations = new Set<InterfaceDeclaration | TypeAliasDeclaration>()
) {
  const declarations = getCustomTypeDeclarationsInNode(node);
  declarations.forEach((declaration) => {
    if (typeDeclarations.has(declaration)) {
      return;
    }
    typeDeclarations.add(declaration);
    recursivelyGetTypeDeclarationsInNode(declaration, typeDeclarations);
  });
  return typeDeclarations;
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
        .getParentIfKind(SyntaxKind.VariableDeclarationList)
        ?.getParentIfKind(SyntaxKind.VariableStatement)
        ?.getJsDocs()
        ?.map((docs) => docs.getStructure()) ?? []
    );
  }
  // For property assignments, the JSDocs should be in the parent.
  if (node.getParentIfKind(SyntaxKind.PropertyAssignment)) {
    // TODO: ts-morph doesn't think PropertyAssignment is JSDocable, so we're abusing the internal functions here!
    const parentNode = node.getParentIfKind(SyntaxKind.PropertyAssignment);
    const jsDocsNodes = (parentNode.compilerNode as any).jsDoc;
    return (
      jsDocsNodes?.map((node) =>
        parentNode["_getNodeFromCompilerNode"](node)
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
      .getParentIfKind(SyntaxKind.BinaryExpression)
      .getParentIfKind(SyntaxKind.ExpressionStatement);
    return parentNode.getJsDocs()?.map((docs) => docs.getStructure()) ?? [];
  }
}

function getFunctionDeclarationStructure(
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

  let returnType: string = null;
  try {
    // If some imported type is returned, get the text via node to get rid of "import" types -
    // otherwise it should be a primitive type
    returnType =
      node.getReturnTypeNode()?.getText() ?? node.getReturnType().getText();
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
    new Set(Array.from(types).map((type) => type.getSymbol().getName()))
  );
  // TODO Set doesn't always seem to work - the same declaration may appear there multiple times
  return uniqueNames.filter(
    (name) =>
      Array.from(types).filter((type) => name === type.getSymbol().getName())
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

  const { path, line, column } = await locate(fn, { sourceMap: true });
  const project = getProject();
  // If the path wasn't included in files, add it to the project (e.g. .js files)
  const sourceFile =
    project.getSourceFile(path) ?? project.addSourceFileAtPath(path);
  const position = getPosForLineAndColumn(sourceFile, line, column);
  const node = getFunctionNode(sourceFile, position);

  // Prepare & unify the function declaration for codegen
  const declarationStructure = getFunctionDeclarationStructure(node);
  // Get all referenced types in a set
  const typeDeclarations = recursivelyGetTypeDeclarationsInNode(node);

  // Each function must have unique named types for now
  assertFunctionHasUniqueTypeNames(declarationStructure.name, typeDeclarations);

  return {
    declarationStructure,
    typeDeclarations,
  } as ResolvedFunction;
}
