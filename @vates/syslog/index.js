'use strict'

const dgram = require('dgram')
const net = require('net')
const os = require('os')
const splitHost = require('split-host')
const tls = require('tls')

// https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1
const FACILITIES = {
  __proto__: null,

  kern: 0,
  user: 1,
  mail: 2,
  daemon: 3,
  auth: 4,
  syslog: 5,
  lpr: 6,
  news: 7,
  uucp: 8,
  cron: 9,
  authpriv: 10,
  ftp: 11,
  ntp: 12,
  audit: 13,
  alert: 14,
  clock: 15,
  local0: 16,
  local1: 17,
  local2: 18,
  local3: 19,
  local4: 20,
  local5: 21,
  local6: 22,
  local7: 23,
}
exports.FACILITIES = Object.keys(FACILITIES)

const SEVERITIES = {
  __proto__: null,

  emergency: 0,
  alert: 1,
  critical: 2,
  error: 3,
  warning: 4,
  notice: 5,
  informational: 6,
  debug: 7,
}
exports.SEVERITIES = Object.keys(SEVERITIES)

const DEFAULT_PORTS = {
  tcp: 514,
  // https://datatracker.ietf.org/doc/html/rfc5425#section-4.1
  tls: 6514,
  udp: 514,
}

// header fields must be printable ASCII characters without spaces
const toHeaderField = (value, maxLength) =>
  String(value)
    .replace(/[^\x21-\x7e]/g, '_')
    .slice(0, maxLength) || '-'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad2 = n => String(n).padStart(2, '0')

const FORMATTERS = {
  // https://datatracker.ietf.org/doc/html/rfc5424#section-6
  rfc5424: ({ appName, hostname, message, msgid, pri, timestamp }) =>
    `<${pri}>1 ${timestamp.toISOString()} ${hostname} ${appName} ${process.pid} ${msgid} - ${message}`,

  // https://datatracker.ietf.org/doc/html/rfc3164#section-4.1, local time without year
  rfc3164: ({ appName, hostname, message, pri, timestamp }) =>
    `<${pri}>${MONTHS[timestamp.getMonth()]} ${String(timestamp.getDate()).padStart(2, ' ')} ${pad2(timestamp.getHours())}:${pad2(timestamp.getMinutes())}:${pad2(timestamp.getSeconds())} ${hostname} ${appName}[${process.pid}]: ${message}`,
}

const FRAMERS = {
  // https://datatracker.ietf.org/doc/html/rfc6587#section-3.4.2
  lf: message => message + '\n',

  // https://datatracker.ietf.org/doc/html/rfc6587#section-3.4.1, required by RFC 5425 (TLS)
  'octet-counting': message => `${Buffer.byteLength(message)} ${message}`,
}

const noop = Function.prototype

// connecting to a host name with several addresses (e.g. IPv4 and IPv6) fails
// with an AggregateError without message, use the messages of its errors
function withMessage(error) {
  if (error.message === '' && Array.isArray(error.errors) && error.errors.length !== 0) {
    error.message = error.errors.map(error => error.message).join(', ')

    // the first line of the stack has been computed with the empty message
    if (typeof error.stack === 'string') {
      const i = error.stack.indexOf('\n')
      error.stack = `${error.name}: ${error.message}${i === -1 ? '' : error.stack.slice(i)}`
    }
  }
  return error
}

class SyslogClient {
  constructor(
    uri,
    {
      appName = 'node',
      ca,
      connectTimeout = 10e3,
      facility = 'user',
      format = 'rfc5424',
      framing = 'lf',
      hostname = os.hostname(),
      ignoreUnauthorized = false,
      maxPendingBytes = 1024 * 1024,
    } = {}
  ) {
    const matches = /^(tcp|tls|udp):\/\/(.+)$/.exec(String(uri).trim())
    const protocol = matches?.[1]
    const { host, port = DEFAULT_PORTS[protocol] } = (matches !== null && splitHost(matches[2])) || {}
    if (!host) {
      throw new Error(
        `invalid syslog URI: ${uri}, it should be like udp://host[:port], tcp://host[:port] or tls://host[:port]`
      )
    }
    if (!(facility in FACILITIES)) {
      throw new Error(`invalid syslog facility: ${facility}`)
    }
    if (!(format in FORMATTERS)) {
      throw new Error(`invalid syslog format: ${format}`)
    }
    if (!(framing in FRAMERS)) {
      throw new Error(`invalid syslog framing: ${framing}`)
    }

    this._appName = toHeaderField(appName, 48)
    this._connectTimeout = connectTimeout
    this._facility = FACILITIES[facility]
    this._format = FORMATTERS[format]
    this._frame = FRAMERS[framing]
    this._host = host
    this._hostname = toHeaderField(hostname, 255)
    this._maxPendingBytes = maxPendingBytes
    this._port = port
    this._send = protocol === 'udp' ? this._sendUdp : this._sendStream
    this._tlsOptions =
      protocol === 'tls'
        ? {
            // the `ca` option replaces the system certificate authorities
            ca: ca === undefined ? undefined : [...tls.rootCertificates, ...ca],
            rejectUnauthorized: !ignoreUnauthorized,
          }
        : undefined

    // at most one socket at a time, created when needed
    this._socket = undefined
  }

  // the client can still be used afterwards, it will reconnect
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

  // resolves when the message has been handed to the system, which does not
  // mean that the server received it (syslog has no acknowledgement)
  send(message, { msgid = '-', severity = 'informational', timestamp = new Date() } = {}) {
    if (!(severity in SEVERITIES)) {
      return Promise.reject(new Error(`invalid syslog severity: ${severity}`))
    }

    const formatted = this._format({
      appName: this._appName,
      hostname: this._hostname,
      message: String(message),
      msgid: toHeaderField(msgid, 32),
      pri: this._facility * 8 + SEVERITIES[severity],
      timestamp,
    })
    return new Promise((resolve, reject) => {
      this._send(formatted, error => (error == null ? resolve() : reject(error)))
    })
  }

  // TCP and TLS
  _sendStream(message, cb) {
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
      const connectTimeout = setTimeout(() => socket.destroy(new Error('connection timed out')), this._connectTimeout)
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

      // do not prevent the process from stopping
      socket.unref()
    }

    // messages are dropped when too much is waiting to be sent (e.g. the server
    // is unreachable or no longer reads), instead of filling the memory, this
    // also covers the messages written while the connection is being established
    if (socket.writableLength > this._maxPendingBytes) {
      cb(new Error('too much data waiting to be sent to the syslog server'))
      return
    }

    // pending writes fail with a generic error when the connection fails, report its cause instead
    socket.write(this._frame(message), error => cb(error == null ? error : withMessage(socket.errored ?? error)))
  }

  // one message per datagram, see https://datatracker.ietf.org/doc/html/rfc5426
  _sendUdp(message, cb) {
    let socket = this._socket
    if (socket === undefined) {
      socket = this._socket = dgram.createSocket(net.isIPv6(this._host) ? 'udp6' : 'udp4')

      // errors are passed to the callbacks of send(), a failed socket is replaced
      socket.on('error', () => {
        if (this._socket === socket) {
          this.close()
        }
      })
      socket.unref()
    }

    socket.send(message, this._port, this._host, cb)
  }
}

exports.createClient = (uri, opts) => new SyslogClient(uri, opts)
