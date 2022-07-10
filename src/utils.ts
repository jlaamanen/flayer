/**
 * Merge two sets
 * @param a Set
 * @param b Another set
 * @returns Merged set
 */
export function mergeSets<T, U>(a: Set<T>, b: Set<U>) {
  const result = new Set<T | U>();
  a.forEach((item) => result.add(item));
  b.forEach((item) => result.add(item));
  return result;
}
