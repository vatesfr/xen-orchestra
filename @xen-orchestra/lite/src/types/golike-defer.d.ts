declare module 'golike-defer' {
  type Cb = () => Promise<unknown> | unknown

  export type Defer = ((cb: Cb) => void) & {
    onFailure: (cb: Cb) => void
    onSuccess: (cb: Cb) => void
  }

  function defer<T, A extends Array<unknown>>(fn: ($defer: Defer, ...args: A) => Promise<T> | T): () => Promise<T> | T

  export default defer
}
