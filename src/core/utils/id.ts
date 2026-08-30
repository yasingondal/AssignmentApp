/** RN-safe unique ID (avoids uuid package which requires `crypto`). */
export function generateId(): string {
  const time = Date.now().toString(16);
  const random = Math.random().toString(16).slice(2, 10);
  return `${time}-${random}-${Math.random().toString(16).slice(2, 6)}`;
}
