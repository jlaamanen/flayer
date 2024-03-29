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
  id: number;
  modulePath: string;
  functionName: string;
  data: string;
}

export type ResultMessage = ResultSuccessMessage | ResultErrorMessage;

export interface ResultSuccessMessage {
  type: "result";
  id: number;
  data: string;
}

export interface ResultErrorMessage {
  type: "result";
  id: number;
  error: {
    name?: string;
    message?: string;
  };
}

export interface CallbackMessage {
  type: "callback";
  id: number;
  args: string;
}

export interface ErrorMessage {
  type: "error";
  id: number;
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
  const fn = await getFunction(message.modulePath, message.functionName).catch(
    (error) => {
      // Function was not found - let the client know via WS
      const errorMessage: ResultErrorMessage = {
        type: "result",
        id: message.id,
        error: {
          name: "FlayerError",
          message: (error as Error).message,
        },
      };
      ws.send(JSON.stringify(errorMessage));
    }
  );
  if (!fn) {
    return null;
  }

  // Function was found - proceed with argument deserialization
  const args = deserialize(message.data, ws);
  let resultMessage: ResultMessage | null = null;
  try {
    // Try to execute the function
    const result = await fn(...args);
    // Serialize the result
    const data = serialize(result, ws);

    // Form the result message
    resultMessage = {
      type: "result",
      id: message.id,
      data,
    };
  } catch (error) {
    // Error during invocation - log it and send it back to the client
    console.error(error);
    resultMessage = {
      type: "result",
      id: message.id,
      error: {
        name: error?.constructor?.name,
        message: error instanceof Error ? error?.message : undefined,
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
