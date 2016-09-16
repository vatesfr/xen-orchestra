declare class Promise {
  constructor (resolver: (
    resolve: (value?: any) => void,
    reject: (reason?: any) => void
  ) => void)

  then (
    thenFn?: (value?: any) => any,
    catchFn?: (reason?: any) => any
  ): Promise

  catch (catchFn?: (reason?: any) => any): Promise
}

declare module 'csv-parser' {
  export = (opts?: Object) => any
}

declare module 'end-of-stream' {
  export = (stream: any, callback: (error?: any) => void)
}

declare module 'exec-promise' {
  export = (cb: (args: string[]) => any) => void
}

declare module 'xo-lib' {
  export default class Xo {
    user: string

    constructor (opts?: {
      credentials?: {},
      url: string
    })

    call (method: string, ...params: any[]): Promise

    open (): Promise

    signIn (credentials: {}): Promise
  }
}
