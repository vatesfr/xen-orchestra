declare module 'xo-common/api-errors.js' {
  export function invalidParameters(message?: string, errors?: unknown): Error
  export function incorrectState(props: {
    actual?: unknown
    expected?: unknown
    object?: string
    property?: string
  }): never
}
