// promise-toolbox ships no types for its `timeout` module: this is what openflow-plugin.js uses of it.
// Only that subpath is declared: declaring the root module would hide the types of the others
declare module 'promise-toolbox/timeout' {
  /**
   * Rejects `promise` if it does not settle within `delay` milliseconds. It takes the
   * promise as `this`, hence `pTimeout.call(promise, delay)`.
   */
  const pTimeout: { call<T>(promise: Promise<T>, delay: number): Promise<T> }
  export default pTimeout
}
