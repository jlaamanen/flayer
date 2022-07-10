import WebSocket from "ws";
import { Context } from "./context";
import { logger } from "./logger";
import { getFunction } from "./modules";
import { deserialize, serialize } from "./serialization";

export type Message = InvocationMessage | CallbackMessage;

export interface InvocationMessage {
  type: "invocation";
  id: string;
  modulePath: string;
  functionName: string;
  data: string;
  context?: Context;
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
  error: string;
  data?: undefined;
}

export interface ErrorMessage {
  type: "error";
  id: string;
  error: string;
}

export interface UpdateContextMessage {
  type: "update-context";
  context: Context;
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
  logger.debug(
    `#${message.id} - Handling invocation message with path ${message.modulePath}/${message.functionName}`
  );
  // Try to find the requested function from the modules
  const fn = getFunction(message.modulePath, message.functionName);
  if (!fn) {
    // Function was not found - let the client know via WS
    logger.debug(
      `#${message.id} - Function not found with path ${message.modulePath}/${message.functionName}`
    );
    const errorMessage: CallbackErrorMessage = {
      type: "callback",
      id: message.id,
      error: `Function "${message.modulePath}/${message.functionName}" not found`,
    };
    ws.send(JSON.stringify(errorMessage));
    return;
  }
  logger.debug(
    `#${
      message.id
    } - Found the function, deserializing arguments: ${JSON.stringify(
      message.data
    )}`
  );
  // Function was found - proceed with argument deserialization
  const args = deserialize(message.data);
  logger.debug(
    `#${message.id} - Deserialized arguments, executing the function`
  );
  let callbackMessage: CallbackMessage = null;
  try {
    // Try to execute the function
    const result = await fn(...args);
    logger.debug(
      `#${message.id} - Execution successful, serializing the result`
    );
    // Serialize the result
    const { json, functionMap } = serialize(result);
    logger.debug(`#${message.id} - Result serialized: ${json}`);
    if (functionMap) {
      // If the function returned functions, start to listen to their results
      // TODO startCallbackListener for each function
      logger.debug(
        `#${message.id} - Arguments contained callback functions, started callback listeners`
      );
    }
    // Form the callback result message
    callbackMessage = {
      type: "callback",
      id: message.id,
      data: json,
    };
  } catch (error) {
    logger.debug(
      `#${message.id} - Execution threw an error, serializing the error`
    );
    // Form the callback error message (the function or serialization threw something)
    const { json } = serialize(error);
    logger.debug(`#${message.id} - Error serialized: ${json}`);
    callbackMessage = {
      type: "callback",
      id: message.id,
      error: json,
    };
  }
  // Finally send the result/error message back to client via WS
  ws.send(JSON.stringify(callbackMessage));
  logger.debug(`#${message.id} - Sent the callback message`);
}

export function handleCallbackMessage(rawMessage: string) {
  // TODO?
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
            error: JSON.stringify({
              message: "missing_fields",
              info: missingFields,
            }),
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
            error: JSON.stringify({
              message: "missing_fields",
              info: missingFields,
            }),
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
          error: JSON.stringify({
            message: "unsupported_message_type",
            info: message.type,
          }),
        } as ErrorMessage)
      );
      return null;
  }
  return message as Message;
}
