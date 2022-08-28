import { AsyncLocalStorage } from "async_hooks";
import { WebSocket } from "ws";

/**
 * Full async local storage object
 */
interface AsyncStore {
  /**
   * Current WebSocket connection.
   */
  ws: WebSocket;
  /**
   * Session ID
   */
  sessionId: string;
}

/**
 * Async local storage that stores provided "store" globally accessible in any invoked function
 * within the invocation lifetime.
 */
const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Runs given function with given data in async context.
 * @param data
 * @param callback
 */
export function runWithAsyncStore(
  data: AsyncStore,
  callback: () => void | Promise<void>
) {
  asyncLocalStorage.run(data, callback);
}

/**
 * Returns current session ID.
 * @returns Sewssion ID
 */
export function getSessionId() {
  const store = asyncLocalStorage.getStore() as AsyncStore;
  return store.sessionId;
}

/**
 * Returns current WebSocket connection.
 * @returns Websocket connection
 */
export function getWebSocket() {
  const store = asyncLocalStorage.getStore() as AsyncStore;
  return store.ws;
}
