/**
 * Client-side configuration for connecting to a Flayer server.
 */
export interface ClientConfig {
  /**
   * URL of the Flayer server WebSocket handle.
   * @example "ws://localhost:8080"
   */
  url: string;
  /**
   * Generic timeout for function execution in milliseconds.
   *
   * If a function takes longer than this timeout, it will be aborted and an error will be thrown.
   */
  timeout?: number;
}
