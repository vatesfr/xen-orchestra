declare module 'xo-common/api-errors.js' {
  export function invalidParameters(message?: string, errors?: unknown): Error
}
