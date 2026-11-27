const DEFAULT_PORT = 443

/**
 * The identity of the source an import comes from, as the XO6 front computes it from its connection: the
 * `instanceUuid` of a vCenter, or `<lowercased host>:<port>` for a standalone ESXi, which has none.
 *
 * `host` is the address the import connects to, which may carry a port: as typed in XO5, or as built by
 * the REST API, which omits the default port and brackets an IPv6 address.
 *
 * @param {string | undefined} instanceUuid - of the vCenter
 * @param {string} host
 * @returns {string}
 */
export function getSourceId(instanceUuid, host) {
  if (instanceUuid) {
    return instanceUuid
  }
  let address = host.trim().toLowerCase()
  let port = DEFAULT_PORT
  const bracketed = /^\[(.*)\](?::(\d+))?$/.exec(address)
  if (bracketed !== null) {
    address = bracketed[1]
    port = bracketed[2] ?? port
  } else {
    // more than one colon is an IPv6 address without a port
    const parts = address.split(':')
    if (parts.length === 2) {
      ;[address, port] = parts
    }
  }
  return `${address}:${Number(port)}`
}
