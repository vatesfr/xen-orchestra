declare module 'lodash' {
  declare export function invert<K, V>(object: { [K]: V }): { [V]: K }
  declare export function isEmpty(mixed): boolean
  declare export function keyBy<T>(array: T[], iteratee: string): boolean
  declare export function last<T>(array?: T[]): T | void
  declare export function mapValues<K, V1, V2>(
    object: { [K]: V1 },
    iteratee: (V1, K) => V2
  ): { [K]: V2 }
  declare export function noop(...args: mixed[]): void
  declare export function values<K, V>(object: { [K]: V }): V[]
}
