import { WebSocket } from "isomorphic-ws";
import { ClientConfig } from "../config/client-config";
import { FlayerConnectionError, FlayerError } from "../error";
import { deserialize, serialize } from "../serialization";
import { connect, sendMessage, waitForMessage } from "../websocket/client";

/**
 * For internal use only - strip these declarations from generated declarations
 * @internal
 */
interface Store {
  flayer: {
    invocationId: number;
    ws: WebSocket | null;
    config: ClientConfig | null;
  };
}

const store = globalThis as unknown as Store;

function get<Key extends keyof Store["flayer"]>(key: Key) {
  return store.flayer?.[key];
}

function set<Key extends keyof Store["flayer"]>(
  key: Key,
  value: Store["flayer"][Key]
) {
  if (!store.flayer) {
    store.flayer = {
      invocationId: 0,
      ws: null,
      config: null,
    };
  }
  store.flayer[key] = value;
}

/**
 * For internal use only - strip this function from generated declarations
 * @internal
 */
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
  set("invocationId", (id ?? 0) + 1);
  const data = serialize(args, ws);
  sendMessage(ws, {
    type: "invocation",
    id,
    modulePath,
    functionName,
    data,
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

/**
 * Closes/invalidates the current WebSocket connection.
 * Connection will be reopened on the next function invocation.
 */
export async function disconnect() {
  const ws = get("ws");
  ws?.close();
  set("ws", null);
}
