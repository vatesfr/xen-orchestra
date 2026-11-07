declare module '@vates/obfuscate' {
  export const OBFUSCATED_VALUE: string
  export function obfuscate<T>(value: T): T
  export function isExportSensitiveParam(name: string): boolean
  export function redact<T>(value: T, isSensitive?: (name: string) => boolean): T
  export function findLeaks(value: unknown, secrets: Iterable<string>): string[]
}
