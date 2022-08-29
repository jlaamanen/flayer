import WebSocket from "ws";
import { getFunction } from "./modules";
import { deserialize, serialize } from "./serialization";

export type Message = InvocationMessage | CallbackMessage;

export interface InvocationMessage {
  type: "invocation";
  id: string;
  modulePath: string;
  functionName: string;
  data: string;
}

export type CallbackMessage = CallbackSuccessMessage | CallbackErrorMessage;

export interface CallbackSuccessMessage {
  type: "callback";
  id: string;
  data: string;
  error?: undefined;
}

export interface CallbackErrorMessage {
  type: "callback";
  id: string;
  error: {
    name: string;
    message: string;
  };
  data?: undefined;
}

export interface ErrorMessage {
  type: "error";
  id: string;
  error: {
    name: string;
    message: string;
  };
}

/**
 * Handles module function invocation messages.
 * Tries to find & execute the function given in the message.
 *
 * - If successful, sends the result back to the client.
 * - If failed, sends the thrown error message back to the client.
 *
 * @param message Invocation message
 * @param ws WebSocker
 */
export async function handleInvocationMessage(
  message: InvocationMessage,
  ws: WebSocket
) {
  // Try to find the requested function from the modules
  const fn = getFunction(message.modulePath, message.functionName);
  if (!fn) {
    // Function was not found - let the client know via WS
    const errorMessage: CallbackErrorMessage = {
      type: "callback",
      id: message.id,
      error: {
        name: "FlayerError",
        message: `Function "${message.modulePath}/${message.functionName}" not found`,
      },
    };
    ws.send(JSON.stringify(errorMessage));
    return;
  }
  // Function was found - proceed with argument deserialization
  const args = deserialize(message.data);
  let callbackMessage: CallbackMessage = null;
  try {
    // Try to execute the function
    const result = await fn(...args);
    // Serialize the result
    const { json, functionMap } = serialize(result);
    if (functionMap) {
      // If the function returned functions, start to listen to their results
      // TODO startCallbackListener for each function
    }
    // Form the callback result message
    callbackMessage = {
      type: "callback",
      id: message.id,
      data: json,
    };
  } catch (error) {
    console.error(error);
    callbackMessage = {
      type: "callback",
      id: message.id,
      error: {
        name: error.constructor.name,
        message: error.message,
      },
    };
  }
  // Finally send the result/error message back to client via WS
  ws.send(JSON.stringify(callbackMessage));
}

/**
 * Parses a raw string message into a JSON message object.
 * @param rawMessage Raw message as string.
 * @param ws WebSocket connection for sending back parse errors
 * @returns Message
 */
export function parseMessage(rawMessage: string, ws: WebSocket) {
  const message = JSON.parse(rawMessage);
  // TODO more rules & more specific validations?
  switch (message.type) {
    case "invocation": {
      const missingFields = ["id", "modulePath", "functionName"].filter(
        (field) => message[field] == null
      );
      if (missingFields.length > 0) {
        ws.send(
          JSON.stringify({
            type: "error",
            id: message.id,
            error: {
              name: "FlayerError",
              message: `Missing fields: ${missingFields.join(", ")}`,
            },
          } as ErrorMessage)
        );
        return null;
      }
      break;
    }
    case "callback": {
      const missingFields = ["id"].filter((field) => message[field] == null);
      if (missingFields.length > 0) {
        ws.send(
          JSON.stringify({
            type: "error",
            id: message.id,
            error: {
              name: "FlayerError",
              message: `Missing fields: ${missingFields.join(", ")}`,
            },
          } as ErrorMessage)
        );
        return null;
      }
      break;
    }
    default:
      ws.send(
        JSON.stringify({
          type: "error",
          id: message.id,
          error: {
            name: "FlayerError",
            message: `Unsupported message type: ${message.type}`,
          },
        } as ErrorMessage)
      );
      return null;
  }
  return message as Message;
}
