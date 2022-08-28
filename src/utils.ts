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

/**
 * Tagged template for collapsing the entire string into null if some of the parameters
 * are nulls.
 *
 * Reduces repetition in certain cases, e.g.
 * ```ts
 * a?.b?.c?.d != null ? `Foo ${a.b.c.d}` : null
 * ```
 * ...is equivalent to:
 * ```ts
 * collapse`Foo ${a?.b?.c?.d}`
 * ```
 * @param strings
 * @param values
 * @returns
 */
export function collapse(strings: TemplateStringsArray, ...values: any[]): string {
  if (values.some(value => value == null)) {
    return null;
  }
  return strings.map((str, index) => `${str}${values[index] ?? ''}`).join('')
}
