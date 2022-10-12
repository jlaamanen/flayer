import { SyntaxKind } from "ts-morph";
import {
  getFunctionDeclarationStructure,
  getProject,
  resolveTypeDeclarationsForFunctionNode,
} from "./type-resolver";

describe("Type resolver", () => {
  test("should resolve simple imported interfaces", () => {
    const project = getProject();

    project.createSourceFile(
      "b.ts",
      `
        export interface Foo {
          a: number;
        }

        /**
         * This type is not used in the signature, so it shouldn't be listed in types
         */
        export type InternalType = 'a' | 'b';
      `
    );

    const node = project
      .createSourceFile(
        "a.ts",
        `
        import { Foo, InternalType } from "./b"

        export function someFunction() {
          const a: InternalType;
          return [{a: 123}] as Foo[];
        }
      `
      )
      .getDescendantsOfKind(SyntaxKind.FunctionDeclaration)[0];

    const structure = getFunctionDeclarationStructure(node);
    const types = resolveTypeDeclarationsForFunctionNode(node);

    expect(structure.returnType).toMatch(/Promise\<.*Foo\>/);
    expect(structure.parameters).toEqual([]);
    expect(structure.typeParameters).toEqual([]);

    const typeNames = Array.from(types.values()).map((type) =>
      type.getSymbol().getName()
    );
    expect(typeNames).toEqual(["Foo"]);
  });
});
