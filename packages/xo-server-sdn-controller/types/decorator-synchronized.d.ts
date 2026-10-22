// decorator-synchronized ships no types: this is what traffic-rules.js uses of it
declare module 'decorator-synchronized' {
  export const synchronized: {
    // The calls of the returned function with the same key run one after the
    // other. Calls return a promise: `fn` has to, for its type to stay true.
    withKey(
      keyFunction: (...args: never[]) => unknown
    ): <Fn extends (...args: never[]) => Promise<unknown>>(fn: Fn) => Fn
  }
}
