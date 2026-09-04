import { NBD_DEFAULT_PORT } from './constants.mjs'

/**
 * Render an NBD server address for a human, bracketing IPv6 literals.
 *
 * Shared with the NBD diagnostic of `@xen-orchestra/xapi` so both render the addresses the same
 * way in the messages a user reads.
 *
 * @param {string} address
 * @param {number} [port]
 * @returns {string}
 */
export function formatAddress(address, port = NBD_DEFAULT_PORT) {
  // an IPv6 literal is the only address containing a colon, and needs brackets to stay readable
  // next to a port
  return address.includes(':') ? `[${address}]:${port}` : `${address}:${port}`
}
