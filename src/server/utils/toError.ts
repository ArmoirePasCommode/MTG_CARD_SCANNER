/**
 * Narrows an unknown catch value to an Error.
 * Avoids the anti-pattern `catch (e: any)` throughout the codebase.
 */
export function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  return new Error(String(value));
}
