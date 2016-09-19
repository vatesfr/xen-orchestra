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
  function csvParser (opts?: Object): any
  export = csvParser
}

declare module 'exec-promise' {
  function execPromise (cb: (args: string[]) => any): void
  export = execPromise
}

declare module 'xo-lib' {
  export default class Xo {
    user?: { email: string }

    constructor (opts?: {
      credentials?: {},
      url: string
    })

    call (method: string, ...params: any[]): Promise

    open (): Promise

    signIn (credentials: {}): Promise
  }
}
