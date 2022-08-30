import WebSocket, { MessageEvent } from "isomorphic-ws";
import { FlayerTimeoutError } from "../error";

/**
 * Creates a WebSocket client and connects to the provided Flayer server URL.
 * @param url Flayer server URL
 */
export async function connect(url: string) {
  if (!url) {
    throw new Error("No URL provided. Did you forget to configure the client?");
  }
  const ws = new WebSocket(url);
  return new Promise<WebSocket>((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve(ws);
    });
    ws.addEventListener("error", (error) => {
      reject(error);
    });
  });
}

export async function sendMessage(ws: WebSocket, message: any) {
  ws.send(JSON.stringify(message));
}

export async function waitForMessage(
  ws: WebSocket,
  condition: { [key: string]: unknown },
  timeout?: number
) {
  const a = await new Promise<string>((resolve, reject) => {
    // Set a timeout if it was provided
    const timeoutHandle =
      timeout != null
        ? setTimeout(() => {
            reject(
              new FlayerTimeoutError(
                "Timeout waiting for function result exceeded"
              )
            );
          }, timeout)
        : null;

    const messageCallback = (message: MessageEvent) => {
      try {
        const jsonMessage = JSON.parse(message.data.toString());
        if (!objectMatchesCondition(jsonMessage, condition)) {
          return;
        }
        // A message matching the condition was received
        clearTimeout(timeoutHandle);
        if (jsonMessage.error) {
          const error = new Error(jsonMessage.error.message);
          // TODO doesn't actually seem to do anything - maybe cast to FlayerError if type = "FlayerError"`
          error.name = jsonMessage.error.name;
          reject(error);
        } else {
          resolve(jsonMessage.data);
        }
        ws.removeListener("message", messageCallback);
      } catch (error) {
        // Non-JSON message - ignore
      }
    };
    ws.addEventListener("message", messageCallback);
  });
  return a;
}

/**
 * Checks if given object contains all expected key-value pairs
 * @param object Object
 * @param condition Condition object
 * @returns Does the object contain all the key-value pairs of the condition?
 */
function objectMatchesCondition(
  object: { [key: string]: unknown },
  condition: { [key: string]: unknown }
) {
  return Object.keys(condition).every(
    (key) => object?.[key] === condition[key]
  );
}
