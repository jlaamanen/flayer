import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import { sendMessage } from "./websocket/client";

export const typeMarkers = {
  date: "@Date",
  map: "@Map",
  set: "@Set",
  bigInt: "@BigInt",
  regExp: "@RegExp",
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
      // Some values (e.g. Date) are serialized with toJSON _before_ running the replacer, making the values _always_ already serialized..
      // Replace nested values when found inside an object/array before reaching the actual value.
      if (
        typeof value === "object" &&
        !(value instanceof Map) &&
        !(value instanceof Set) &&
        !(value instanceof RegExp) &&
        value != null
      ) {
        // Prevent mutations to the original object by creating a new one
        const newValue = Array.isArray(value) ? [...value] : { ...value };
        for (const key in value) {
          if (value[key] instanceof Date) {
            newValue[key] = [typeMarkers.date, value[key].toISOString()];
          }
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
      if (value instanceof RegExp) {
        return [typeMarkers.regExp, [value.source, value.flags]];
      }
      if (value instanceof Error) {
        return [typeMarkers.error, value.message];
      }
      if (typeof value === "bigint") {
        return [typeMarkers.bigInt, value.toString()];
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

export function deserialize(json: string, ws: WebSocket) {
  if (json == null) {
    return null;
  }
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
          return new Map(deserialize(serializedValue, ws));
        case typeMarkers.set:
          return new Set(deserialize(serializedValue, ws));
        case typeMarkers.regExp:
          return new RegExp(serializedValue[0], serializedValue[1]);
        case typeMarkers.error:
          return new Error(serializedValue);
        case typeMarkers.bigInt:
          return BigInt(serializedValue);
        case typeMarkers.function:
          const fn = (...args) => {
            const functionId = serializedValue;
            // TODO how about serialization here?
            sendMessage(ws, {
              type: "callback",
              id: functionId,
              args,
            });
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
