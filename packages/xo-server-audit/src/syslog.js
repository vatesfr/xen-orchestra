import dgram from 'dgram'
import net from 'net'
import os from 'os'
import splitHost from 'split-host'
import tls from 'tls'
import { createLogger } from '@xen-orchestra/log'
import { fromCallback } from 'promise-toolbox'

const log = createLogger('xo:xo-server-audit:syslog')

// https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1
export const SYSLOG_FACILITIES = {
  user: 1,
  auth: 4,
  authpriv: 10,
  audit: 13,
  local0: 16,
  local1: 17,
  local2: 18,
  local3: 19,
  local4: 20,
  local5: 21,
  local6: 22,
  local7: 23,
}

const SEVERITY_WARNING = 4
const SEVERITY_INFORMATIONAL = 6

const SEVERITIES = {
  signInFailed: SEVERITY_WARNING,
}

const CONNECT_TIMEOUT = 10e3

// records are dropped when more than this is waiting to be sent (e.g. the
// server is unreachable or no longer reads), instead of filling the memory of
// xo-server
const MAX_PENDING_BYTES = 1024 * 1024

const noop = Function.prototype

// connecting to a host name with several addresses (e.g. IPv4 and IPv6) fails
// with an AggregateError without message, use the messages of its errors
function withMessage(error) {
  if (error.message === '' && Array.isArray(error.errors) && error.errors.length !== 0) {
    error.message = error.errors.map(error => error.message).join(', ')
  }
  return error
}

// header fields must be printable ASCII characters without spaces
const toHeaderField = (value, maxLength) => value.replace(/[^\x21-\x7e]/g, '_').slice(0, maxLength) || '-'

const HOSTNAME = toHeaderField(os.hostname(), 255)

// https://datatracker.ietf.org/doc/html/rfc5424#section-6
const formatMessage = ({ facility, msgid, message, severity, timestamp }) =>
  `<${facility * 8 + severity}>1 ${timestamp.toISOString()} ${HOSTNAME} xo-audit ${process.pid} ${toHeaderField(msgid, 32)} - ${message}`

export class SyslogForwarder {
  // ca: contents of the certificate authorities to trust in addition to the system ones (TLS only)
  constructor({ ca, checkCertificate = true, facility = 'authpriv', target }) {
    const matches = /^(tcp|tls|udp):\/\/(.+)$/.exec(target.trim())
    const protocol = matches?.[1]

    // https://datatracker.ietf.org/doc/html/rfc5425#section-4.1
    const { host, port = protocol === 'tls' ? 6514 : 514 } = (matches !== null && splitHost(matches[2])) || {}
    if (!host) {
      throw new Error(
        `invalid syslog target: ${target}, it should be like udp://host[:port], tcp://host[:port] or tls://host[:port]`
      )
    }

    this._facility = SYSLOG_FACILITIES[facility]
    this._host = host
    this._port = port
    this._send = protocol === 'udp' ? this._sendUdp : this._sendTcp
    this._tlsOptions =
      protocol === 'tls'
        ? {
            // the `ca` option replaces the system certificate authorities
            ca: ca === undefined ? undefined : [...tls.rootCertificates, ...ca],
            rejectUnauthorized: checkCertificate,
          }
        : undefined

    this._nFailures = 0

    // at most one socket at a time, created when needed
    this._socket = undefined
  }

  // the forwarder can still be used afterwards, it will reconnect
  close() {
    const socket = this._socket
    if (socket !== undefined) {
      this._socket = undefined
      if (socket instanceof net.Socket) {
        socket.destroy()
      } else {
        socket.close()
      }
    }
  }

  forward(record) {
    const message = formatMessage({
      facility: this._facility,
      message: JSON.stringify(record),
      msgid: record.event,
      severity: SEVERITIES[record.event] ?? SEVERITY_INFORMATIONAL,
      timestamp: new Date(record.time),
    })
    this._send(message, error => this._onResult(error))
  }

  test() {
    const message = formatMessage({
      facility: this._facility,
      message: 'test message from the audit plugin of Xen Orchestra',
      msgid: 'test',
      severity: SEVERITY_INFORMATIONAL,
      timestamp: new Date(),
    })
    return fromCallback(cb => this._send(message, cb))
  }

  // TCP and TLS, messages are separated by a line feed (non-transparent
  // framing), see https://datatracker.ietf.org/doc/html/rfc6587#section-3.4.2
  _sendTcp(message, cb) {
    let socket = this._socket
    if (socket === undefined) {
      const tlsOptions = this._tlsOptions
      const options = { host: this._host, port: this._port }
      socket = this._socket =
        tlsOptions === undefined ? net.connect(options) : tls.connect({ ...tlsOptions, ...options })

      // a connection attempt that never completes (e.g. packets dropped by a
      // firewall, or a TLS handshake without answer) must not stay around
      //
      // not socket.setTimeout() which is an inactivity timeout, postponed by
      // each write during a TLS handshake
      const connectTimeout = setTimeout(() => socket.destroy(new Error('connection timed out')), CONNECT_TIMEOUT)
      connectTimeout.unref()
      socket.on(tlsOptions === undefined ? 'connect' : 'secureConnect', () => {
        clearTimeout(connectTimeout)

        // detect a server which disappeared without closing the connection
        socket.setKeepAlive(true, 60e3)
      })

      // errors are passed to the callbacks of the pending writes
      socket.on('error', noop)
      socket.on('close', () => {
        clearTimeout(connectTimeout)
        if (this._socket === socket) {
          this._socket = undefined
        }
      })

      // do not prevent xo-server from stopping
      socket.unref()
    }

    // also covers the messages written while the connection is being established
    if (socket.writableLength > MAX_PENDING_BYTES) {
      cb(new Error('too much data waiting to be sent to the syslog server'))
      return
    }

    // pending writes fail with a generic error when the connection fails, report its cause instead
    socket.write(message + '\n', error => cb(error == null ? error : withMessage(socket.errored ?? error)))
  }

  // one message per datagram, see https://datatracker.ietf.org/doc/html/rfc5426
  _sendUdp(message, cb) {
    let socket = this._socket
    if (socket === undefined) {
      socket = this._socket = dgram.createSocket(net.isIPv6(this._host) ? 'udp6' : 'udp4')
      socket.on('error', error => {
        log.warn('syslog UDP socket error', { error })
        if (this._socket === socket) {
          this.close()
        }
      })
      socket.unref()
    }

    socket.send(message, this._port, this._host, cb)
  }

  // only report the first failure and the recovery to avoid a warning per record
  _onResult(error) {
    if (error == null) {
      if (this._nFailures !== 0) {
        log.info('forwarding to syslog recovered', { nFailures: this._nFailures })
        this._nFailures = 0
      }
    } else if (this._nFailures++ === 0) {
      log.warn('failed to forward records to syslog, next failures will not be reported until it recovers', {
        error,
      })
    }
  }
}
