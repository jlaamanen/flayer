import { WebSocket } from "ws";
import { Message } from "./message";
import { sendMessage, waitForMessage } from "./websocket/client";

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

// Sequential ID for identifying callback functions
let callbackId = 0;

/**
 * Starts a callback listener for "serialized" functions
 * @param ws WebSocket
 * @param fn Function
 */
function startCallbackListener(ws: WebSocket, fn: Function) {
  const id = callbackId++;

  const callback = async (event: MessageEvent) => {
    // Parse the message and ignore non-relevant messages
    const message = JSON.parse(event.data) as Message;
    if (message.type !== "callback" || message.id !== id) {
      return;
    }

    // Matching message found - deserialize args and invoke the callback function
    const args = deserialize(message.args, ws);
    const result = await fn(...args);

    // Send the data back returned from the callback
    ws.send(
      JSON.stringify({
        type: "callback",
        id,
        data: serialize(result, ws),
      })
    );
  };

  // Assign the callback as a WebSocket event listener
  (ws as any).addEventListener("message", callback);
  // On disconnect remove the event listener
  ws.addEventListener("close", () => {
    (ws as any).removeEventListener("message", callback);
  });

  return id;
}

/**
 * Serializes the given object.
 *
 * If contains functions, starts listening to their invocations via WebSocket.
 *
 * @param object Object to be serialized
 * @param ws WebSocket
 * @returns Serialized string
 */
export function serialize(object: any, ws: WebSocket): string {
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
        const serialized = serialize(Array.from(value.entries()), ws);
        return [typeMarkers.map, serialized];
      }
      if (value instanceof Set) {
        // Serialize the Set contents - add possible new functions to the function map too
        const serialized = serialize(Array.from(value.values()), ws);
        return [typeMarkers.set, serialized];
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
        const id = startCallbackListener(ws, value);
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
    return json;
  } catch (error) {
    throw new SerialiationError(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Deserializes the given JSON string.
 *
 * If contains functions, wraps them into functions that send a message via WwbSocket.
 *
 * @param json Serialized object as JSON
 * @param ws WebSocket
 * @returns Deserialized object
 */
export function deserialize(json: string, ws: WebSocket): any {
  // Any falsy value -> return the value as-is (null, undefined, false, 0...)
  if (!json) {
    return json;
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
          const fn = async (...args: any[]) => {
            const functionId = serializedValue;
            sendMessage(ws, {
              type: "callback",
              id: functionId,
              args: serialize(args, ws),
            });
            // Wait for callback result from the other side
            const result = await waitForMessage(ws, {
              type: "callback",
              id: functionId,
            });
            return deserialize(result, ws);
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
    console.error(error);
    throw new SerialiationError(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

export class SerialiationError extends Error {
  constructor(cause: string) {
    super(`Serialization failed: ${cause}`);
  }
}
