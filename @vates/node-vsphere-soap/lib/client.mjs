/*

  node-vsphere-soap

  client.js

  This file creates the Client class

  - when the class is instantiated, a connection will be made to the ESXi/vCenter server to verify that the creds are good
  - upon a bad login, the connection will be terminated

*/

import { EventEmitter } from 'events'
import axios from 'axios'
import https from 'node:https'
import util from 'util'
import soap from 'soap'
import Cookie from 'soap-cookie' // required for session persistence
import { createLogger } from '@xen-orchestra/log'

import { parseFault } from './_parseFault.mjs'

// exposed for the consumers talking to the host outside of the WSDL, e.g. `Fetch`
export { parseFault } from './_parseFault.mjs'

const { warn } = createLogger('xo:node-vsphere-soap:client')
class VmwareError extends Error {
  constructor(rawError) {
    const { code, faultcode, faultstring, localizedMessage, body } = parseFault(rawError)
    super(localizedMessage ?? faultstring ?? rawError?.message ?? 'unknown SOAP error')
    this.name = 'VmwareError'
    // the vim25 fault type, the only part of a fault a caller can branch on
    this.code = code
    this.faultcode = faultcode
    this.faultstring = faultstring
    this.localizedMessage = localizedMessage
    this.body = body
    if (rawError?.stack !== undefined) {
      this.stack = rawError.stack
    }
    // legacy constraint: not putting the cause since the error failed to be stringified correctly
    // down the road, the fault is exposed through own properties instead
    warn('SOAP call failed', { code, faultcode, faultstring, localizedMessage })
  }
}
// Client class
// inherits from EventEmitter
// possible events: connect, error, ready

export function Client(vCenterHostname, username, password, sslVerify) {
  this.status = 'disconnected'
  this.reconnectCount = 0
  this._exitHook = undefined

  sslVerify = typeof sslVerify !== 'undefined' ? sslVerify : false

  EventEmitter.call(this)

  // sslVerify argument handling
  // don't use any proxy to connect to the esxi
  if (sslVerify) {
    this.clientopts = {
      request: axios.create({
        proxy: false,
      }),
    }
  } else {
    this.clientopts = {
      request: axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        proxy: false,
      }),
    }
  }

  this.connectionInfo = {
    host: vCenterHostname,
    user: username,
    password,
    sslVerify,
  }

  this._loginArgs = {
    userName: this.connectionInfo.user,
    password: this.connectionInfo.password,
  }

  this._vcUrl = 'https://' + this.connectionInfo.host + '/sdk/vimService.wsdl'

  // connect to the vCenter / ESXi host
  this.on('connect', this._connect)
  this.emit('connect')

  // close session
  this.on('close', this._close)

  return this
}

util.inherits(Client, EventEmitter)

Client.prototype.runCommand = function (command, args) {
  const self = this
  const cmdargs = args ?? {}

  const emitter = new EventEmitter()

  const onResponse = function (err, result, raw, soapHeader) {
    if (err) {
      // an error and a result are mutually exclusive: emitting both makes every caller listening
      // for 'result' believe the call succeeded, with `result` undefined
      _soapErrorHandler(self, emitter, command, cmdargs, err)
      return
    }
    if (command === 'Logout') {
      self.status = 'disconnected'
      self._unregisterExitHook()
    }
    emitter.emit('result', result, raw, soapHeader)
  }

  const send = function () {
    self.client.VimService.VimPort[command](cmdargs, onResponse)
  }

  // check if client has successfully connected
  if (self.status === 'ready' || self.status === 'connecting') {
    send()
  } else {
    // if connection not ready or connecting, reconnect to instance
    if (self.status === 'disconnected') {
      self.emit('connect')
    }

    // a failed connection would otherwise leave this listener registered for ever, and the next
    // successful one would replay every command whose caller has long given up
    const onConnectionError = error => {
      self.off('ready', onReady)
      emitter.emit('error', error)
    }
    const onReady = () => {
      self.off('error', onConnectionError)
      send()
    }
    self.once('ready', onReady)
    self.once('error', onConnectionError)
  }

  return emitter
}

Client.prototype.close = function () {
  const self = this

  self.emit('close')
}

Client.prototype._connect = function () {
  const self = this

  if (self.status !== 'disconnected') {
    return
  }

  self.status = 'connecting'

  soap.createClient(
    self._vcUrl,
    self.clientopts,
    function (err, client) {
      if (err) {
        self.status = 'disconnected'
        // throwing here would be an uncaught exception: we are in an async callback, not in the
        // stack of the caller
        self.emit('error', new VmwareError(err))
        return
      }

      self.client = client // save client for later use

      self
        .runCommand('RetrieveServiceContent', { _this: 'ServiceInstance' })
        .once('result', function (result, raw, soapHeader) {
          if (!result.returnval) {
            // this is a domain/server error return it as is
            self.status = 'disconnected'
            self.emit('error', raw)
            return
          }

          self.serviceContent = result.returnval
          self.sessionManager = result.returnval.sessionManager
          const loginArgs = { _this: self.sessionManager, ...self._loginArgs }

          self
            .runCommand('Login', loginArgs)
            .once('result', function (result, raw, soapHeader) {
              self.authCookie = new Cookie(client.lastResponseHeaders)
              self.client.setSecurity(self.authCookie) // needed since vSphere SOAP WS uses cookies

              self.userName = result.returnval.userName
              self.fullName = result.returnval.fullName
              self.reconnectCount = 0

              self.status = 'ready'
              self.emit('ready')
              self._registerExitHook()
            })
            .once('error', function (err) {
              self.status = 'disconnected'
              self.emit('error', err)
            })
        })
        .once('error', function (err) {
          self.status = 'disconnected'
          self.emit('error', err)
        })
    },
    self._vcUrl
  )
}

// Logs out on process exit, so that a session is not left open on the server until it expires.
//
// The hook must be stored: passing `self._close` directly would call it with `this === process`,
// and removing it with `process.removeAllListeners('beforeExit')` would drop the hooks of every
// other module of the process.
Client.prototype._registerExitHook = function () {
  const self = this

  if (self._exitHook === undefined) {
    self._exitHook = function () {
      self._close()
    }
    process.once('beforeExit', self._exitHook)
  }
}

Client.prototype._unregisterExitHook = function () {
  const self = this

  if (self._exitHook !== undefined) {
    process.off('beforeExit', self._exitHook)
    self._exitHook = undefined
  }
}

Client.prototype._close = function () {
  const self = this

  self._unregisterExitHook()

  if (self.status === 'ready') {
    self
      .runCommand('Logout', { _this: self.sessionManager })
      .once('result', function () {
        self.status = 'disconnected'
      })
      .once('error', function () {
        /* don't care of error during disconnection */
        self.status = 'disconnected'
      })
  } else {
    self.status = 'disconnected'
  }
}

// Errors are only emitted on `emitter`, the emitter of the failed call: throwing from here would
// be an uncaught exception since we are always in an async callback, and emitting on the client
// would reject unrelated concurrent calls.
//
// Exported for the unit tests: building a `Client` connects to a host.
export function _soapErrorHandler(self, emitter, command, args, err) {
  err = err || { body: 'general error' }

  const vErr = new VmwareError(err)

  // `NotAuthenticated` is raised when the session expired: log in again and replay the call.
  //
  // The fault type is used instead of the previous `err.body?.match(...)`: node-soap only fills
  // `body` for streamed responses, so the string test never matched and the session was never
  // renewed
  const isSessionExpired =
    vErr.code === 'NotAuthenticated' || /session is not authenticated/i.test(vErr.faultstring ?? vErr.message)

  if (!isSessionExpired || self.reconnectCount >= 10) {
    emitter.emit('error', vErr)
    return
  }

  // The call is replayed only once a new session is ready. Handing it straight to `runCommand`
  // would send it right away while the status is 'connecting' — i.e. on the very session which
  // just expired — and the failure of that replay would land back here.
  const onConnectionError = function (error) {
    self.off('ready', onReady)
    emitter.emit('error', error)
  }
  const onReady = function () {
    self.off('error', onConnectionError)
    self
      .runCommand(command, args)
      .once('result', function (result, raw, soapHeader) {
        emitter.emit('result', result, raw, soapHeader)
      })
      .once('error', function (retryError) {
        emitter.emit('error', retryError)
      })
  }
  self.once('ready', onReady)
  self.once('error', onConnectionError)

  // A whole wave of calls can fail on the same expired session, e.g. during an import. Only the
  // first one to notice drops it and pays for a retry: the others ride the reconnect it started,
  // instead of each burning one of the 10 and of resetting the status under a `_connect` already
  // in flight — which used to start a second `soap.createClient` and replace `self.client` under
  // the first one.
  if (self.status === 'ready') {
    self.status = 'disconnected'
    self._unregisterExitHook()
    self.reconnectCount += 1
  }
  if (self.status === 'disconnected') {
    // no reconnect in flight: either this call is the first to notice, or the previous attempt
    // already failed
    self.emit('connect')
  }
}

// end
