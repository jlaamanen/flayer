import { WebSocket } from "isomorphic-ws";
import { ClientConfig } from "../config/client-config";
import { FlayerConnectionError, FlayerError } from "../error";
import { Message } from "../message";
import { deserialize, serialize } from "../serialization";
import { connect, sendMessage, waitForMessage } from "../websocket/client";

declare global {
  interface Window {
    flayer: {
      invocationId: number;
      ws: WebSocket;
      config: ClientConfig;
    };
  }
}

function get<Key extends keyof typeof window["flayer"]>(key: Key) {
  return window.flayer[key];
}

function set<Key extends keyof typeof window["flayer"]>(
  key: Key,
  value: typeof window["flayer"][Key]
) {
  if (!window.flayer) {
    window.flayer = {
      invocationId: 0,
      ws: null,
      config: null,
    };
  }
  window.flayer[key] = value;
}

export async function executeFlayerFunction(
  modulePath: string,
  functionName: string,
  args: any[]
) {
  let ws = get("ws");
  if (!ws || ws.readyState !== ws.OPEN) {
    const config = get("config");
    if (!config) {
      throw new FlayerError("Client not configured");
    }
    try {
      ws = await connect(config.url);
      set("ws", ws);
    } catch (error) {
      throw new FlayerConnectionError("Error connecting to server");
    }
  }

  let id = get("invocationId");
  set("invocationId", id + 1);
  const { json, functionMap } = serialize(args);
  sendMessage(ws, {
    type: "invocation",
    id,
    modulePath,
    functionName,
    data: json,
  });

  // Start event listeners for all "serialized" functions
  Array.from(functionMap).forEach(([id, fn]) => {
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

  const result = await waitForMessage(ws, {
    type: "result",
    id,
  });
  return deserialize(result, ws);
}

/**
 * Configure the client to use a Flayer sever
 * @param config Client config
 * @returns WebSocket connection
 */
export async function configure(config: ClientConfig) {
  set("config", config);
  set("ws", await connect(config.url));
}
