declare module 'promise-toolbox' {
  declare export class CancelToken {
    static source(): { cancel: (message: any) => void, token: CancelToken };
  }
  declare export function cancelable(Function): Function
  declare export function defer<T>(): {|
    promise: Promise<T>,
    reject: T => void,
    resolve: T => void,
  |}
  declare export function fromCallback<T>(
    (cb: (error: any, value: T) => void) => void
  ): Promise<T>
  declare export function fromEvent(emitter: mixed, string): Promise<mixed>
  declare export function ignoreErrors(): Promise<void>
  declare export function timeout<T>(delay: number): Promise<T>
}
