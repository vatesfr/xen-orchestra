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

const { warn } = createLogger('xo:node-vsphere-soap:client')
class VmwareError extends Error {
  constructor(rawError) {
    super(rawError.body)
    const matches = rawError.body?.match(/<faultstring[^>]*>(.*)<\/faultstring>/im)
    this.message = matches?.[1] ?? rawError.message
    this.name = 'VmwareError'
    this.stack = rawError.stack
    // not putting the cause since the error failed to be stringified correctly down the road
    warn(rawError)
  }
}
// Client class
// inherits from EventEmitter
// possible events: connect, error, ready

export function Client(vCenterHostname, username, password, sslVerify) {
  this.status = 'disconnected'
  this.reconnectCount = 0

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
  let cmdargs
  if (!args || args === null) {
    cmdargs = {}
  } else {
    cmdargs = args
  }

  const emitter = new EventEmitter()

  // check if client has successfully connected
  if (self.status === 'ready' || self.status === 'connecting') {
    self.client.VimService.VimPort[command](cmdargs, function (err, result, raw, soapHeader) {
      if (err) {
        _soapErrorHandler(self, emitter, command, cmdargs, err)
      }
      if (command === 'Logout') {
        self.status = 'disconnected'
        process.removeAllListeners('beforeExit')
      }
      emitter.emit('result', result, raw, soapHeader)
    })
  } else {
    // if connection not ready or connecting, reconnect to instance
    if (self.status === 'disconnected') {
      self.emit('connect')
    }
    self.once('ready', function () {
      self.client.VimService.VimPort[command](cmdargs, function (err, result, raw, soapHeader) {
        if (err) {
          _soapErrorHandler(self, emitter, command, cmdargs, err)
        }
        if (command === 'Logout') {
          self.status = 'disconnected'
          process.removeAllListeners('beforeExit')
        }
        emitter.emit('result', result, raw, soapHeader)
      })
    })
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
        const vErr = new VmwareError(err)
        self.emit('error', vErr)
        throw vErr
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
              process.once('beforeExit', self._close)
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

Client.prototype._close = function () {
  const self = this

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

function _soapErrorHandler(self, emitter, command, args, err) {
  err = err || { body: 'general error' }

  if (err.body?.match(/session is not authenticated/)) {
    self.status = 'disconnected'
    process.removeAllListeners('beforeExit')

    if (self.reconnectCount < 10) {
      self.reconnectCount += 1
      self
        .runCommand(command, args)
        .once('result', function (result, raw, soapHeader) {
          emitter.emit('result', result, raw, soapHeader)
        })
        .once('error', function (err) {
          const vErr = new VmwareError(err)
          emitter.emit('error', vErr)
          throw vErr
        })
    } else {
      const vErr = new VmwareError(err)
      emitter.emit('error', vErr)
      throw vErr
    }
  } else {
    const vErr = new VmwareError(err)
    emitter.emit('error', vErr)
    throw vErr
  }
}

// end
