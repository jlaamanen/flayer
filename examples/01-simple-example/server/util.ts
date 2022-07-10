/**
 * Sleep for a given number of milliseconds.
 * @param ms Milliseconds to sleep.
 */
export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
