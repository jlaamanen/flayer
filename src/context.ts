import { AsyncLocalStorage } from "async_hooks";
import { WebSocket } from "ws";

/**
 * Full async local storage object
 */
interface Store {
  /**
   * Current WebSocket connection.
   */
  ws: WebSocket;
  /**
   * Current flayer context.
   */
  context: Context;
}

/**
 * Flayer invocation context object.
 */
export interface Context {
  [key: string]: number | string | boolean;
}

/**
 * Async local storage that stores provided "store" globally accessible in any invoked function
 * within the invocation lifetime.
 */
const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Runs given function with given context.
 * @param context
 * @param callback
 */
export function runWithAsyncStore(
  store: Store,
  callback: () => void | Promise<void>
) {
  asyncLocalStorage.run(store, callback);
}

// TODO: update context via ws
export function updateContext(context: Context) {}

/**
 * Returns current Flayer context.
 * @returns Flayer context
 */
export function getContext<T extends Context = Context>() {
  const store = asyncLocalStorage.getStore() as Store;
  return store.context as T;
}

/**
 * Returns current WebSocket connection.
 * @returns Websocket connection
 */
export function getWebSocket() {
  const store = asyncLocalStorage.getStore() as Store;
  return store.ws;
}
