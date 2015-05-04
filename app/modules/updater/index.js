import angular from 'angular'
import Bluebird from 'bluebird'
import {EventEmitter} from 'events'
import Socket from 'socket.io-client'

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
            this.emit('print', content)
            Array.isArray(content) || (content = [content])
            content.forEach(elem => this.log('info', content))
          })
          socket.on('end', end => {
            this.emit('end', end)
            this._lowState = end
            switch (this._lowState.state) {
              case 'xoa-up-to-date':
              case 'xoa-updated':
              case 'updater-updated':
                this.state = 'upToDate'
                break
              case 'xoa-update-needed':
              case 'updater-update-needed':
                this.state = 'updateNeeded'
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
          })
          socket.on('error', error => {
            this.log('error', error.message)
            this.emit('error', error)
            this._lowState = error
            this.state = 'error'
          })
          socket.on('connected', connected => {
            this.log('info', connected)
            this.emit('connected', connected)
            resolve(socket)
          })
          socket.on('disconnect', () => {
            socket.removeAllListeners()
            this._connection = null
          })
        })
        return this._connection
      }
    }

    _update (update = false) {
      this._open()
      .then(socket => socket.emit('jsonrpc', '{"jsonrpc":"2.0","method":"main", "params": {"update": ' + update + '}}'))
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

.name
