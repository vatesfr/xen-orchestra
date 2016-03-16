import * as format from '@julien-f/json-rpc/format'
import angular from 'angular'
import Bluebird from 'bluebird'
import makeError from 'make-error'
import parse from '@julien-f/json-rpc/parse'
import uiBootstrap from 'angular-ui-bootstrap'
import WebSocket from 'ws'
import {EventEmitter} from 'events'

import modal from './modal'

const calls = {}

let blockTime

function jsonRpcCall (socket, method, params = {}) {
  const req = format.request(method, params)
  const reqId = req.id
  socket.send(JSON.stringify(req))
  let waiter = {}
  const promise = new Bluebird((resolve, reject) => {
    waiter.resolve = resolve
    waiter.reject = reject
  })
  calls[reqId] = waiter
  return promise
}

function jsonRpcNotify (socket, method, params = {}) {
  return Bluebird.resolve(socket.send(JSON.stringify(format.notification(method, params))))
}

function getCurrentUrl () {
  if (typeof window === 'undefined') {
    throw new Error('cannot get current URL')
  }
  return String(window.location)
}

function adaptUrl (url, port = null) {
  const matches = /^http(s?):\/\/([^\/:]*(?::[^\/]*)?)(?:[^:]*)?$/.exec(url)
  if (!matches || !matches[2]) {
    throw new Error('current URL not recognized')
  }
  return 'ws' + matches[1] + '://' + matches[2] + '/api/updater'
}

function blockXoaAccess (xoaState) {
  return xoaState.state === 'untrustedTrial'
}

export const NotRegistered = makeError('NotRegistered')
export const AuthenticationFailed = makeError('AuthenticationFailed')
export default angular.module('updater', [
  uiBootstrap
])
.factory('updater', function ($interval, $timeout, $window, $modal) {
  class Updater extends EventEmitter {
    constructor () {
      super()
      this._log = []
      this._lastRun = 0
      this._lowState = null
      this.state = null
      this.registerState = 'uknown'
      this.registerError = ''
      this._connection = null
      this.isConnected = false
      this.updating = false
      this.upgrading = false
      this.token = null
    }

    update () {
      this.emit('updating')
      this.updating = true
      return this._update(false)
    }

    upgrade () {
      this.emit('upgrading')
      this.upgrading = true
      return this._update(true)
    }

    _promptForReload () {
      const modalInstance = $modal.open({
        template: modal,
        backdrop: false
      })

      return modalInstance.result
      .then(() => {
        $window.location.reload()
      })
      .catch(() => true)
    }

    _open () {
      if (this._connection) {
        return this._connection
      } else {
        this._connection = new Bluebird((resolve, reject) => {
          const socket = new WebSocket(adaptUrl(getCurrentUrl()))
          const middle = new EventEmitter()
          this.isConnected = true
          const timeout = $timeout(() => {
            middle.emit('reconnect_failed')
          }, 4000)
          socket.onmessage = ({data}) => {
            const message = parse(data)
            if (message.type === 'response' && message.id !== undefined) {
              if (calls[message.id]) {
                if (message.result) {
                  calls[message.id].resolve(message.result)
                } else {
                  calls[message.id].reject(message.error)
                }
                delete calls[message.id]
              }
            } else {
              middle.emit(message.method, message.params)
            }
          }
          socket.onclose = () => {
            middle.emit('disconnect')
          }
          middle.on('connected', ({message}) => {
            $timeout.cancel(timeout)
            this.log('success', message)
            this.state = 'connected'
            resolve(socket)
            if (!this.updating) {
              this.update()
            }
            this.emit('connected', message)
          })
          middle.on('print', ({content}) => {
            Array.isArray(content) || (content = [content])
            content.forEach(elem => this.log('info', elem))
            this.emit('print', content)
          })
          middle.on('end', end => {
            this._lowState = end
            switch (this._lowState.state) {
              case 'xoa-up-to-date':
              case 'xoa-upgraded':
              case 'updater-upgraded':
                this.state = 'upToDate'
                break
              case 'xoa-upgrade-needed':
              case 'updater-upgrade-needed':
                this.state = 'upgradeNeeded'
                break
              case 'register-needed':
                this.state = 'registerNeeded'
                break
              case 'error':
                this.state = 'error'
                break
              default:
                this.state = null
            }
            this.log(end.level, end.message)
            this._lastRun = Date.now()
            this.upgrading = this.updating = false
            this.emit('end', end)
            if (this._lowState.state === 'updater-upgraded') {
              this.update()
            } else if (this._lowState.state === 'xoa-upgraded') {
              this._promptForReload()
            }
            this.xoaState()
          })
          middle.on('warning', warning => {
            this.log('warning', warning.message)
            this.emit('warning', warning)
          })
          middle.on('server-error', error => {
            this.log('error', error.message)
            this._lowState = error
            this.state = 'error'
            this.upgrading = this.updating = false
            this.emit('error', error)
          })
          middle.on('disconnect', () => {
            this._lowState = null
            this.state = null
            this.upgrading = this.updating = false
            this.log('warning', 'Lost connection with xoa-updater')
            this.emit('disconnect')
            middle.emit('reconnect_failed') // No reconnecting attempts implemented so far
          })
          middle.on('reconnect_failed', () => {
            this.isConnected = false
            middle.removeAllListeners()
            socket.close()
            this._connection = null
            const message = 'xoa-updater could not be reached'
            this._xoaStateError({message})
            reject(new Error(message))
            this.log('error', message)
            this.emit('reconnect_failed')
          })
        })
        return this._connection
      }
    }

    isRegistered () {
      return this._open()
      .then(socket => {
        return jsonRpcCall(socket, 'isRegistered')
        .then(token => {
          if (token.registrationToken === undefined) {
            throw new NotRegistered('Your Xen Orchestra Appliance is not registered')
          } else {
            this.registerState = 'registered'
            this.token = token
            return token
          }
        })
      })
      .catch(NotRegistered, () => {
        this.registerState = 'unregistered'
      })
      .catch(error => {
        this.registerError = error.message
        this.registerState = 'error'
      })
    }

    register (email, password, renew = false) {
      return this._open()
      .then(socket => {
        return jsonRpcCall(socket, 'register', {email, password, renew})
        .then(token => {
          this.registerState = 'registered'
          this.registerError = ''
          this.token = token
          return token
        })
      })
      .catch(error => {
        if (error.code && error.code === 1) {
          this.registerError = 'Authentication failed'
          throw new AuthenticationFailed('Authentication failed')
        } else {
          this.registerError = error.message
          this.registerState = 'error'
          throw error
        }
      })
    }

    xoaState () {
      return this._open()
      .then(socket => {
        return jsonRpcCall(socket, 'xoaState')
        .then(state => {
          this._xoaState = state
          this._xoaStateTS = Date.now()
          return state
        })
      })
      .catch(error => this._xoaStateError(error))
    }

    _xoaStateError (error) {
      this._xoaState = {
        state: 'ERROR',
        message: error.message
      }
      this._xoaStateTS = Date.now()
      return this._xoaState
    }

    _update (upgrade = false) {
      return this._open()
      .tap(() => this.log('info', 'Start ' + (upgrade ? 'upgrading' : 'updating' + '...')))
      .then(socket => jsonRpcNotify(socket, 'update', {upgrade}))
    }

    start () {
      if (!this._xoaState) {
        this.xoaState()
      }
      if (!this._interval) {
        this._interval = $interval(() => this.run(), 60 * 60 * 1000)
        return this.run()
      } else {
        return Bluebird.resolve()
      }
    }

    stop () {
      if (this._interval) {
        $interval.cancel(this._interval)
        delete this._interval
      }
    }

    run () {
      if (Date.now() - this._lastRun < 24 * 60 * 60 * 1000) {
        return Bluebird.resolve()
      } else {
        return this.update()
      }
    }

    isStarted () {
      return this._interval !== null
    }

    log (level, message) {
      const date = new Date()
      this._log.unshift({
        date: date.toLocaleString(),
        level,
        message
      })
      while (this._log.length > 10) {
        this._log.pop()
      }
    }

    getConfiguration () {
      return this._open()
      .then(socket => {
        return jsonRpcCall(socket, 'getConfiguration')
        .then(configuration => this._configuration = configuration)
      })
    }

    configure (config) {
      return this._open()
      .then(socket => {
        return jsonRpcCall(socket, 'configure', config)
        .then(configuration => this._configuration = configuration)
      })
    }
  }

  return new Updater()
})
.run(function (updater, $rootScope, $state, xoApi) {
  updater.start()
  .catch(() => {})

  $rootScope.$on('$stateChangeStart', function (event, state) {
    if (Date.now() - updater._xoaStateTS > (60 * 60 * 1000)) {
      updater.xoaState()
    }
    let {user} = xoApi
    let loggedIn = !!user
    if (!loggedIn || !updater._xoaState || state.name === 'settings.update') { // no reason to block
      return
    } else if (blockXoaAccess(updater._xoaState)) {
      blockTime || (blockTime = updater._xoaStateTS)
      updater.xoaState()
      if (Date.now() - blockTime < (60 * 1000)) { // We have 1 min before blocking for real
        return
      }
      event.preventDefault()
      $state.go('settings.update')
    } else {
      blockTime = undefined
    }
  })
})

.name
