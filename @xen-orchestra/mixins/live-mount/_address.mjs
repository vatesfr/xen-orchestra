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
