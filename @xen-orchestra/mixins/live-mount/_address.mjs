import { createSocket } from 'node:dgram'

/**
 * The local address the OS would use to reach `host`, found the same way
 * `ip route get`/Go's `net.Dial` trick does: "connecting" a UDP socket never
 * sends a packet on the wire — it only asks the kernel to resolve a route and
 * bind a local address for it — so this works even when `host` refuses
 * connections or nothing is listening on `port`.
 *
 * Not a guarantee `host` can reach the resolved address back (NAT, asymmetric
 * routing, a firewall): it answers "what can reach `host`", not "what `host`
 * can reach", which is why `iscsi.advertisedAddress` remains available as an
 * override.
 */
export function detectLocalAddress(host, port = 1) {
  return new Promise((resolve, reject) => {
    const socket = createSocket('udp4')
    socket.once('error', error => {
      socket.close()
      reject(error)
    })
    socket.connect(port, host, () => {
      const { address } = socket.address()
      socket.close()
      resolve(address)
    })
  })
}

/**
 * Every address `hostRef` may connect from: its management address, and the ones of its PIFs, a
 * storage network included.
 *
 * @param {object} xapi
 * @param {string} hostRef
 * @param {string} [hostAddress] - its management address, if already known
 * @returns {Promise<string[]>}
 */
export async function getHostAddresses(xapi, hostRef, hostAddress) {
  const addresses = new Set([hostAddress ?? (await xapi.getField('host', hostRef, 'address'))])
  for (const pifRef of await xapi.getField('host', hostRef, 'PIFs')) {
    const { IP, IPv6 } = await xapi.getRecord('PIF', pifRef)
    if (IP !== '') {
      addresses.add(IP)
    }
    // with their prefix length, e.g. `fd00::1/64`, and canonicalized like the remote address of a
    // socket, e.g. `fd00:0:0::1` becomes `fd00::1`
    for (const address of IPv6) {
      addresses.add(new URL(`http://[${address.split('/')[0]}]`).hostname.slice(1, -1))
    }
  }
  return [...addresses]
}
