export function flatten<T>(arrays: T[][]): T[] {
  return ([] as T[]).concat(...arrays);
}
