import { v4 as uuidv4 } from "uuid";

// TODO Buffer is not supported in browsers - should it be supported by serialization?

export const typeMarkers = {
  date: "@Date",
  map: "@Map",
  set: "@Set",
  bigint: "@BigInt",
  // buffer: "@Buffer",
  function: "@Function",
  special: "@SpecialValue",
  error: "@Error",
} as const;

type TypeMarker = typeof typeMarkers[keyof typeof typeMarkers];

function isSerialized(value: any) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Object.values(typeMarkers).includes(value[0])
  );
}

function mergeFunctionMaps(a: Map<string, Function>, b: Map<string, Function>) {
  if (!a && !b) {
    return null;
  }
  if (!b) {
    return a;
  }
  if (!a) {
    return b;
  }
  return new Map([...(!a ? [] : Array.from(a)), ...(!b ? [] : Array.from(b))]);
}

export function serialize(object: any): {
  json: string;
  functionMap: Map<string, Function>;
} {
  let functionMap: Map<string, Function> = null;
  try {
    const json = JSON.stringify(object, (_, value) => {
      // Some values (Date, Buffer) are serialized with toJSON _before_ running the replacer, making the values _always_ already serialized..
      // Replace nested values when found inside an object/array before reaching the actual value.
      if (
        typeof value === "object" &&
        !(value instanceof Map) &&
        !(value instanceof Set) &&
        // !(value instanceof Buffer) &&
        value != null
      ) {
        // Prevent mutations to the original object by creating a new one
        const newValue = Array.isArray(value) ? [...value] : { ...value };
        for (const key in value) {
          if (value[key] instanceof Date) {
            newValue[key] = [typeMarkers.date, value[key].toISOString()];
          }
          // if (value[key] instanceof Buffer) {
          //   newValue[key] = [typeMarkers.buffer, value[key].toString("base64")];
          // }
        }
        return newValue;
      }
      if (value instanceof Map) {
        // Serialize the Map contents - add possible new functions to the function map too
        const serialized = serialize(Array.from(value.entries()));
        functionMap = mergeFunctionMaps(functionMap, serialized.functionMap);
        return [typeMarkers.map, serialized.json];
      }
      if (value instanceof Set) {
        // Serialize the Set contents - add possible new functions to the function map too
        const serialized = serialize(Array.from(value.values()));
        functionMap = mergeFunctionMaps(functionMap, serialized.functionMap);
        return [typeMarkers.set, serialized.json];
      }
      if (value instanceof Error) {
        return [typeMarkers.error, value.message];
      }
      if (typeof value === "bigint") {
        return [typeMarkers.bigint, value.toString()];
      }
      if (typeof value === "function") {
        if (!functionMap) {
          functionMap = new Map();
        }
        const id = uuidv4();
        functionMap.set(id, value);
        return [typeMarkers.function, id];
      }
      if (typeof value === "number" && isNaN(value)) {
        return [typeMarkers.special, "NaN"];
      }
      if (value === Infinity) {
        return [typeMarkers.special, "Infinity"];
      }
      if (value === -Infinity) {
        return [typeMarkers.special, "-Infinity"];
      }
      return value;
    });
    return {
      json,
      functionMap,
    };
  } catch (error) {
    throw new SerialiationError(error.message);
  }
}

export function deserialize(json: string) {
  try {
    return JSON.parse(json, (key, value) => {
      if (!isSerialized(value)) {
        return value;
      }
      const [type, serializedValue] = value as [type: TypeMarker, value: any];
      switch (type) {
        case typeMarkers.date:
          return new Date(serializedValue);
        case typeMarkers.map:
          return new Map(deserialize(serializedValue));
        case typeMarkers.set:
          return new Set(deserialize(serializedValue));
        case typeMarkers.error:
          return new Error(serializedValue);
        case typeMarkers.bigint:
          return BigInt(serializedValue);
        // case typeMarkers.buffer:
        //   return Buffer.from(serializedValue, "base64");
        case typeMarkers.function:
          const fn = (...args) => {
            const functionId = serializedValue;
            console.log("TODO: emit ws message with function id", functionId);
          };
          // Override function name with the key
          Object.defineProperty(fn, "name", { value: key, writable: false });
          return fn;
        case typeMarkers.special:
          switch (serializedValue) {
            case "NaN":
              return NaN;
            case "Infinity":
              return Infinity;
            case "-Infinity":
              return -Infinity;
            default:
              return value;
          }
        default:
          // No special deserialization detected - return value as it was
          return value;
      }
    });
  } catch (error) {
    throw new Error("serialization_error");
  }
}

export class SerialiationError extends Error {
  constructor(cause: string) {
    super(`Serialization failed: ${cause}`);
  }
}
