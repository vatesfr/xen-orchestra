// decorator-synchronized ships no types: this is what traffic-rules.js uses of it
declare module 'decorator-synchronized' {
  export const synchronized: {
    // Same-key calls run one after the other. `fn` has to return a promise, for the type to hold.
    withKey(key: (...args: never[]) => unknown): <Fn extends (...args: never[]) => Promise<unknown>>(fn: Fn) => Fn
  }
}
