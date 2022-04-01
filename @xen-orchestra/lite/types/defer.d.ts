declare module 'golike-defer' {
  export type $Defer = {
    onFailure: (cb: (err: unknown) => void) => void
    onSuccess: (cb: () => void) => void
  } & ((cb: () => void, ...args: any[]) => void)

  function defer<T>(target: T, method: keyof T): any
}
