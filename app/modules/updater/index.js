import angular from 'angular'
import Bluebird from 'bluebird'
import {EventEmitter} from 'events'
import * as format from '@julien-f/json-rpc/format'
import makeError from 'make-error'
import parse from '@julien-f/json-rpc/parse'
import io from 'socket.io-client'

function jsonRpcCall (socket, method, params = {}) {
  let resolver, rejecter
  const promise = new Bluebird((resolve, reject) => {
    resolver = resolve
    rejecter = reject
  })
  socket.emit(
    'jsonrpc',
    format.request(method, params),
    message => {
      const {result, error} = parse(message)
      if (result) {
        resolver(result)
      } else if (error) {
        rejecter(error)
      } else {
        throw new Error('Unexpected response')
      }
    }
  )
  return promise
}

function jsonRpcNotify (socket, method, params = {}) {
  return Bluebird.resolve(socket.emit('jsonrpc', format.notification(method, params)))
}

function getCurrentUrl () {
  if (typeof window === 'undefined') {
    throw new Error('cannot get current URL')
  }
  return String(window.location)
}

function adaptUrl (url, port) {
  const matches = /^https?:\/\/([^\/:]*)(?::[^\/]*)?(?:[^:]*)?$/.exec(url)
  if (!matches) {
    throw new Error('current URL not recognized')
  }
  return 'http://' + matches[1] + ':' + port
}

export const NotRegistered = makeError('NotRegistered')
export const AuthenticationFailed = makeError('AuthenticationFailed')
export default angular.module('updater', [
  // notify
  ])
.factory('updater', function ($interval) {
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
      this._reconnectAttempts = 0
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
      .return(true)
    }

    _open () {
      if (this._connection) {
        return this._connection
      } else {
        this._connection = new Bluebird((resolve, reject) => {
          const socket = io(adaptUrl(getCurrentUrl(), 9001), {
            multiplex: false,
            reconnectionDelay: 4000,
            reconnectionDelayMax: 4000,
            reconnectionAttempts: 10
          })
          this.isConnected = true
          socket.on('reconnect_failed', () => {
            this.isConnected = false
            socket.removeAllListeners()
            socket.disconnect()
            this._connection = null
            reject('reconnect_failed')
            this.log('error', 'xoa-updater could not be reached')
            this.emit('reconnect_failed')
          })
          socket.on('print', content => {
            Array.isArray(content) || (content = [content])
            content.forEach(elem => this.log('info', elem))
            this.emit('print', content)
          })
          socket.on('end', end => {
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
            }
            this.xoaState()
          })
          socket.on('warning', warning => {
            this.log('warning', warning.message)
            this.emit('warning', warning)
          })
          socket.on('error', error => {
            this.log('error', error.message)
            this._lowState = error
            this.state = 'error'
            this.upgrading = this.updating = false
            this.emit('error', error)
          })
          socket.on('connected', connected => {
            this.log('success', connected)
            this.state = 'connected'
            resolve(socket)
            if (!this.updating) {
              this.update()
            }
            this.emit('connected', connected)
          })
          socket.on('disconnect', () => {
            this._lowState = null
            this.state = null
            this.upgrading = this.updating = false
            this.log('warning', 'Lost connection with xoa-updater. Attempting to reconnect...')
            this.emit('disconnect')
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
      .catch(NotRegistered, () => this.registerState = 'unregistered')
      .catch(error => {
        this.registerError = error.message
        this.registerState = 'error'
      })
    }

    register (email, password) {
      return this._open()
      .then(socket => {
        return jsonRpcCall(socket, 'register', {email, password})
        .then(token => {
          this.registerState = 'registered'
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
        }
      })
    }

    requestTrial () {
      if (this._xoaState && this._xoaState.trial) {
        throw new Error('You are already under trial')
      }
      return this._open()
      .then(socket => {
        return jsonRpcCall(socket, 'requestTrial')
      })
      .finally(() => this.xoaState())
    }

    xoaState () {
      return this._open()
      .then(socket => {
        return jsonRpcCall(socket, 'xoaState')
        .then(state => {
          this._xoaStateTS = Date.now()
          this._xoaState = state
          return state
        })
        .catch(error => console.error(error))
      })
    }

    _update (upgrade = false) {
      return this._open()
      .then(socket => jsonRpcNotify(socket, 'update', {upgrade}))
    }

    start () {
      if (!this._xoaState) {
        this.xoaState()
        .catch(error => this._xoaState = {
          state: 'ERROR',
          message: error.message
        })
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
  }

  return new Updater()
})
.run(function (updater, $rootScope, $state, xoApi) {
  updater.start()
  .catch(err => console.error(err)) // FIXME

  $rootScope.$on('$stateChangeStart', function (event, state) {
    if (Date.now() - updater._xoaStateTS > (60 * 60 * 1000)) {
      updater.xoaState()
    }
    let {user} = xoApi
    let loggedIn = !!user
    if (!loggedIn || !updater._xoaState || state.name === 'settings.update') {
      return
    } else if (updater._xoaState.state === 'ERROR' || updater._xoaState.state === 'untrustedTrial') {
      event.preventDefault()
      $state.go('settings.update')
    }
  })
})

.name
