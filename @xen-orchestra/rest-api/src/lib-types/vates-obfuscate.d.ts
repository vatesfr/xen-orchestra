declare module '@vates/obfuscate' {
  export const OBFUSCATED_VALUE: string
  export function merge<T>(newValue: T, oldValue: unknown): T
}
