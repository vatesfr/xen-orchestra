import fromEvent from 'promise-toolbox/fromEvent'
import createLogger from '@xen-orchestra/log'
import { connect } from 'tls'

// =============================================================================

const log = createLogger('xo:xo-server:sdn-controller:tls-connect')

// =============================================================================

export class TlsHelper {
  updateCertificates(clientKey, clientCert, caCert) {
    this._clientKey = clientKey
    this._clientCert = clientCert
    this._caCert = caCert
    log.debug('Certificates have been updated')
  }

  // ---------------------------------------------------------------------------

  async connect(address, port) {
    const options = {
      ca: this._caCert,
      key: this._clientKey,
      cert: this._clientCert,
      host: address,
      port,
      rejectUnauthorized: false,
      requestCert: false,
    }
    const socket = connect(options)
    try {
      await fromEvent(socket, 'secureConnect', {})
    } catch (error) {
      log.error('TLS connection failed', {
        error,
        code: error.code,
        address,
        port,
      })
      throw error
    }

    socket.on('error', error => {
      log.error('Socket error', {
        error,
        code: error.code,
        address,
        port,
      })
    })

    return socket
  }
}
