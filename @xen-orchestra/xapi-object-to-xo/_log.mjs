// Stub for @xen-orchestra/log, whose transports are node-only.
// xapi-object-to-xo only ever calls debug() and warn().
/* eslint-disable no-console */
export const createLogger = namespace => ({
  debug: (...args) => console.debug(namespace, ...args),
  warn: (...args) => console.warn(namespace, ...args),
})
/* eslint-enable no-console */
