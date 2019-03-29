declare module 'exec-promise' {
  function execPromise(cb: (args: string[]) => any): void
  export = execPromise
}

declare module 'xo-lib' {
  export default class Xo {
    user?: { email: string }

    constructor(opts?: { credentials?: {}; url: string })

    call(method: string, ...params: any[]): Promise<any>

    open(): Promise<void>

    signIn(credentials: {}): Promise<void>
  }
}
