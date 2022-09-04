import WebSocket from "ws";
import { getFunction } from "./modules";
import { deserialize, serialize } from "./serialization";

export type Message =
  | InvocationMessage
  | ResultMessage
  | CallbackMessage
  | ErrorMessage;

export interface InvocationMessage {
  type: "invocation";
  id: string;
  modulePath: string;
  functionName: string;
  data: string;
}

export type ResultMessage = ResultSuccessMessage | ResultErrorMessage;

export interface ResultSuccessMessage {
  type: "result";
  id: string;
  data: string;
}

export interface ResultErrorMessage {
  type: "result";
  id: string;
  error: {
    name: string;
    message: string;
  };
}

export interface CallbackMessage {
  type: "callback";
  id: string;
  args: string;
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
    const errorMessage: ResultErrorMessage = {
      type: "result",
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
  const args = deserialize(message.data, ws);
  let resultMessage: ResultMessage = null;
  try {
    // Try to execute the function
    const result = await fn(...args);
    // Serialize the result
    const { json, functionMap } = serialize(result);

    // If the function returned functions, start to listen to their results
    if (functionMap) {
      Array.from(functionMap.entries()).forEach(([id, fn]) => {
        const callback = async (event: MessageEvent) => {
          // Parse the message and ignore non-relevant messages
          const message = JSON.parse(event.data) as Message;
          if (message.type !== "callback" || message.id !== id) {
            return;
          }

          // Matching message found - deserialize args and invoke the callback function
          const args = deserialize(message.args, ws);
          await fn(...args);
        };

        // Assign the callback as a WebSocket event listener
        ws.on("message", callback);
        // On disconnect remove the event listener
        ws.addEventListener("close", () => {
          ws.off("message", callback);
        });
      });
    }

    // Form the result message
    resultMessage = {
      type: "result",
      id: message.id,
      data: json,
    };
  } catch (error) {
    // Error during invocation - log it and send it back to the client
    console.error(error);
    resultMessage = {
      type: "result",
      id: message.id,
      error: {
        name: error.constructor.name,
        message: error.message,
      },
    };
  }
  // Finally send the result/error message back to client via WS
  ws.send(JSON.stringify(resultMessage));
}

/**
 * Parses a raw string message into a JSON message object.
 * @param rawMessage Raw message as string.
 * @param ws WebSocket connection for sending back parse errors
 * @returns Message
 */
export function parseMessage(rawMessage: string, ws: WebSocket) {
  const message = JSON.parse(rawMessage);

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

    case "callback":
    case "result": {
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
