import { WebSocket } from "ws";
import { deserialize, SerialiationError, serialize } from "./serialization";

// Mock WebSocket, but with correct type enforced
const mockWs: WebSocket = null as any;

describe("Serialization", () => {
  describe("with basic values", () => {
    test("should handle a flat object", () => {
      const original = {
        someNumber: 123,
        someString: "123",
        someDate: new Date(),
        someMap: new Map([
          [123, 321],
          [234, 432],
        ]),
        someSet: new Set(["a", "b", "c", "d"]),
        someRegExp: /regexp/g,
        someArray: ["1", "2", "3"],
        someBigInt: BigInt("123456789012345678901234567890"),
        nan: NaN,
        infinity: Infinity,
        minusInfinity: -Infinity,
        empty: null,
      };
      const serialized = serialize(original, mockWs);
      const deserialized = deserialize(serialized, mockWs);

      expect(deserialized).toEqual(original);
    });

    test("should handle deep nesting", () => {
      const original = {
        a: {
          b: {
            c: {
              someMap: new Map([
                [1, null],
                [
                  2,
                  new Set([
                    "a",
                    "b",
                    new Map([
                      [1, 2],
                      [3, 4],
                    ]),
                    "d",
                    new Date(),
                  ]),
                ],
              ]),
            },
          },
        },
      };
      const serialized = serialize(original, mockWs);
      const deserialized = deserialize(serialized, mockWs);

      expect(deserialized).toEqual(original);
    });

    test("should handle top-level arrays", () => {
      const original = [
        1,
        new Date(),
        new Map([
          [1, 2],
          [3, 4],
        ]),
        new Set([1, 2, 3, 4]),
        NaN,
        Infinity,
        -Infinity,
      ];
      const serialized = serialize(original, mockWs);
      const deserialized = deserialize(serialized, mockWs);

      expect(deserialized).toEqual(original);
    });

    test("should handle top-level sets", () => {
      const original = new Set([1, 2, 3, 4, [new Date()]]);
      const serialized = serialize(original, mockWs);
      const deserialized = deserialize(serialized, mockWs);

      expect(deserialized).toEqual(original);
    });

    test("should handle top-level maps", () => {
      const original = new Map<number, number | Date>([
        [1, 2],
        [3, 4],
        [5, new Date()],
      ]);
      const serialized = serialize(original, mockWs);
      const deserialized = deserialize(serialized, mockWs);

      expect(deserialized).toEqual(original);
    });

    test("should handle simple class instances", () => {
      class Foo {
        bar: string;
        baz: Date;

        constructor(bar: string, baz: Date) {
          this.bar = bar;
          this.baz = baz;
        }

        getSomething() {
          return 1 + 1;
        }
      }

      const date = new Date();
      const classObject = new Foo("bar", date);
      const serialized = serialize(classObject, mockWs);
      const deserialized = deserialize(serialized, mockWs);

      expect(deserialized).toEqual({
        bar: "bar",
        baz: date,
      });
    });
  });

  describe("with non-supported values", () => {
    test("should throw an error for circular objects", () => {
      class Circular {
        bar = "bar";
        circular = this;
      }
      expect(() => serialize(new Circular(), mockWs)).toThrow(
        SerialiationError
      );
    });
  });
});
