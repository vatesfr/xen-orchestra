declare module 'golike-defer' {
  export type $Defer = {
    onFailure: (cb: (err: unknown) => Promise<void> | void) => void
    onSuccess: (cb: () => void) => Promise<void> | void
  } & ((cb: () => Promise<void> | void, ...args: any[]) => void)

  function defer<T>(target: T, method: keyof T): any
}
