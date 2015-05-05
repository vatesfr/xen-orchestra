import angular from 'angular'
import Bluebird from 'bluebird'
import {EventEmitter} from 'events'
import * as format from '@julien-f/json-rpc/format'
import makeError from 'make-error'
import parse from '@julien-f/json-rpc/parse'
import Socket from 'socket.io-client'

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
  socket.emit(
    'jsonrpc',
    format.notification(method, params)
  )
}

export const NotRegistered = makeError('NotRegistered')
export const AuthenticationFailed = makeError('AuthenticationFailed')
export default angular.module('updater', [])

.factory('updater', function ($interval) {
  class Updater extends EventEmitter {
    constructor () {
      super()
      this._log = []
      this._lastRun = 0
      this._lowState = null
      this.state = null
      this._connection = null
    }
    verify () {
      return this._update(false)
    }

    update () {
      return this._update(true)
    }

    _open () {
      if (this._connection) {
        return this._connection
      } else {
        this._connection = new Bluebird((resolve, reject) => {
          const socket = new Socket('http://localhost:9001')
          socket.on('print', content => {
            Array.isArray(content) || (content = [content])
            content.forEach(elem => this.log('info', elem))
            this.emit('print', content)
          })
          socket.on('end', end => {
            this._lowState = end
            switch (this._lowState.state) {
              case 'xoa-up-to-date':
              case 'xoa-updated':
              case 'updater-updated':
                this.state = 'upToDate'
                break
              case 'xoa-update-needed':
              case 'updater-update-needed':
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
            this.emit('end', end)
          })
          socket.on('error', error => {
            this.log('error', error.message)
            this._lowState = error
            this.state = 'error'
            this.emit('error', error)
          })
          socket.on('connected', connected => {
            this.log('info', connected)
            this.state = 'connected'
            resolve(socket)
            this.emit('connected', connected)
          })
          socket.on('disconnect', () => {
            this._lowState = null
            this.state = null
            this.emit('disconnect')
          })
        })
        return this._connection
      }
    }

    _update (update = false) {
      this._open()
      .then(socket => jsonRpcNotify(socket, 'main', {update}))
    }

    start () {
      if (!this._interval) {
        this._interval = $interval(() => this.run(), 5 * 60 * 1000)
        this.run()
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
        return
      } else {
        this.verify()
      }
    }

    isStarted () {
      return this._interval !== null
    }

    log (level, message) {
      const date = new Date()
      this._log.unshift({
        date,
        level,
        message
      })
    }
  }

  return new Updater()
})

.factory('register', function () {
  class Register {
    constructor () {
      this._connection = null
      this.token = null
      this.state = 'unknown'
      this.error = ''
    }

    _open () {
      if (this._connection) {
        return this._connection
      } else {
        this._connection = new Bluebird((resolve, reject) => {
          const socket = new Socket('http://localhost:9002')
          socket.on('connected', connected => {
            resolve(socket)
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
            this.state = 'registered'
            this.token = token
            return token
          }
        })
      })
      .catch(NotRegistered, () => this.state = 'unregistered')
      .catch(error => {
        this.error = error.message
        this.state = 'error'
      })
    }

    register (email, password) {
      return this._open()
      .then(socket => {
        return jsonRpcCall(socket, 'register', {email, password})
        .then(token => {
          this.state = 'registered'
          this.token = token
          return token
        })
      })
      .catch(error => {
        if (error.code && error.code === 1) {
          this.error = 'Authentication failed'
          throw new AuthenticationFailed('Authentication failed')
        } else {
          this.error = error.message
          this.state = 'error'
        }
      })
    }
  }

  return new Register()
})

.name
