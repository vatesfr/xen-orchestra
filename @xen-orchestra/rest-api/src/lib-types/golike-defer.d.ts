declare module 'golike-defer' {
  type Cb = () => Promise<unknown> | unknown

  export type Defer = ((cb: Cb) => void) & {
    onFailure: (cb: Cb) => void
    onSuccess: (cb: Cb) => void
  }

  declare const defer: <T, A extends Array<unknown>>(fn: ($defer: Defer, ...args: A) => T) => (...args: A) => T
}
