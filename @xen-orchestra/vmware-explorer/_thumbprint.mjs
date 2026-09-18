import { connect } from 'node:tls'
import { isIP } from 'node:net'

/**
 * SHA-256 fingerprint of the certificate presented by a TLS server, in the `sha256:AA:BB:...` form
 * vectura expects for `--thumbprint`.
 *
 * This used to shell out to `openssl s_client` and `openssl x509`, which left a temporary
 * directory and a file descriptor behind on every call, had no timeout at all — a black holed port
 * froze the whole start of an import — and threw from inside a callback instead of rejecting,
 * terminating the process.
 *
 * @param {string} host
 * @param {object} [options]
 * @param {number} [options.port]
 * @param {number} [options.timeout] - in ms, for the whole handshake
 * @returns {Promise<string>}
 */
export function getCertificateThumbprint(host, { port = 443, timeout = 10e3 } = {}) {
  return new Promise((resolve, reject) => {
    const socket = connect({
      host,
      port,
      // the fingerprint is precisely what is being read here, and a self signed certificate is the
      // norm on a host
      rejectUnauthorized: false,
      // needed by a host serving several names, and absent from the openssl call it replaces.
      // RFC 6066 forbids an IP address there, and Node warns about it
      servername: isIP(host) === 0 ? host : undefined,
      timeout,
    })

    const fail = error => {
      socket.destroy()
      reject(error)
    }

    socket.once('secureConnect', () => {
      // `fingerprint` is the SHA-1 one, which is not what is pinned here
      const { fingerprint256 } = socket.getPeerCertificate()
      if (typeof fingerprint256 !== 'string' || fingerprint256.length === 0) {
        // nothing to wait for on this path, drop the socket instead of half closing it
        return fail(new Error(`the host ${host}:${port} did not present any certificate`))
      }
      socket.end()
      resolve(`sha256:${fingerprint256}`)
    })
    socket.once('timeout', () => {
      fail(new Error(`no TLS handshake with ${host}:${port} after ${timeout}ms`))
    })
    socket.once('error', error => {
      const wrapped = new Error(`can't read the certificate of ${host}:${port}`)
      wrapped.cause = error
      wrapped.code = error.code
      fail(wrapped)
    })
  })
}
