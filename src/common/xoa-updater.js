import Client from 'jsonrpc-websocket-client'
import eventToPromise from 'event-to-promise'
import forEach from 'lodash.foreach'
import makeError from 'make-error'
import { EventEmitter } from 'events'
import {
  xoaConfiguration,
  xoaRegisterState,
  xoaUpdaterLog,
  xoaUpdaterState
} from 'store/actions'

// ===================================================================

const states = [
  'disconnected',
  'updating',
  'upgrading',
  'upToDate',
  'upgradeNeeded',
  'registerNeeded',
  'error'
]

// ===================================================================

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

// function blockXoaAccess (xoaState) {
//   return xoaState.state === 'untrustedTrial'
// }

// ===================================================================

export const NotRegistered = makeError('NotRegistered')
export const AuthenticationFailed = makeError('AuthenticationFailed')

class XoaUpdater extends EventEmitter {
  constructor () {
    super()
    this._waiting = false
    this._log = []
    this._lastRun = 0
    this._lowState = null
    this.state('disconnected')
    this.registerError = ''
    this._client = null
    this.token = null
    this._configuration = {}
  }

  state (state) {
    this._state = state
    this.emit(state)
  }

  async update () {
    if (this._waiting) {
      return
    }
    this._waiting = true
    this.state('updating')
    this._update(false)
  }

  async upgrade () {
    if (this._waiting) {
      return
    }
    this._waiting = true
    this.state('upgrading')
    await this._update(true)
  }

  _promptForReload () {
    this.emit('promptForReload')
  }

  async _open () {
    if (!this._client) {
      this._client = new Client(adaptUrl(getCurrentUrl()))
    }
    const c = this._client
    if (c.status === 'closed') {
      const middle = new EventEmitter()
      const handleError = error => {
        this.log('error', error.message)
        this._lowState = error
        this.state('error')
        this._waiting = false
        this.emit('error', error)
      }

      c.on('notification', n => middle.emit(n.method, n.params))
      c.on('closed', () => middle.emit('disconnected'))

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
            this.state('upToDate')
            break
          case 'xoa-upgrade-needed':
          case 'updater-upgrade-needed':
            this.state('upgradeNeeded')
            break
          case 'register-needed':
            this.state('registerNeeded')
            break
          default:
            this.state('error')
        }
        this.log(end.level, end.message)
        this._lastRun = Date.now()
        this._waiting = false
        this.emit('end', end)
        if (this._lowState === 'register-needed') {
          this.isRegistered()
        }
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
      middle.on('server-error', handleError)
      middle.on('disconnected', () => {
        this._lowState = null
        this.state('disconnected')
        this._waiting = false
        this.log('warning', 'Lost connection with xoa-updater')
        middle.emit('reconnect_failed') // No reconnecting attempts implemented so far
      })
      middle.on('reconnect_failed', () => {
        this._waiting = false
        middle.removeAllListeners()
        this._client.removeAllListeners()
        if (this._client.status !== 'closed') {
          this._client.close()
        }
        const message = 'xoa-updater could not be reached'
        this._xoaStateError({message})
        this.log('error', message)
        this.emit('disconnected')
      })
      await c.open()
      this.update()
      this.getConfiguration()
      return c
    } else if (c.status === 'open') {
      return c
    } else {
      return eventToPromise.multi(this._client, ['open'], ['closed', 'error'])
    }
  }

  async isRegistered () {
    try {
      const c = await this._open()
      const token = await c.call('isRegistered')
      if (token.registrationToken === undefined) {
        throw new NotRegistered('Your Xen Orchestra Appliance is not registered')
      } else {
        this.registerState = 'registered'
        this.token = token
        return token
      }
    } catch (error) {
      if (error instanceof NotRegistered) {
        this.registerState = 'unregistered'
      } else {
        this.registerError = error.message
        this.registerState = 'error'
      }
    } finally {
      this.emit('registerState', {state: this.registerState, email: this.token && this.token.registrationEmail || ''})
    }
  }

  async register (email, password, renew = false) {
    try {
      const c = await this._open()
      const token = await c.call('register', {email, password, renew})
      this.registerState = 'registered'
      this.registerError = ''
      this.token = token
      return token
    } catch (error) {
      if (error.code && error.code === 1) {
        this.registerError = 'Authentication failed'
        throw new AuthenticationFailed('Authentication failed')
      } else {
        this.registerError = error.message
        this.registerState = 'error'
        throw error
      }
    } finally {
      this.emit('registerState', {state: this.registerState, error: this.registerError})
      if (this.registerState === 'registered') {
        this.update()
      }
    }
  }

  async xoaState () {
    try {
      const c = await this._open()
      const state = await c.call('xoaState')
      this._xoaState = state
      this._xoaStateTS = Date.now()
      return state
    } catch (error) {
      this._xoaStateError(error)
    }
  }

  _xoaStateError (error) {
    this._xoaState = {
      state: 'ERROR',
      message: error.message
    }
    this._xoaStateTS = Date.now()
    return this._xoaState
  }

  async _update (upgrade = false) {
    try {
      const c = await this._open()
      this.log('info', 'Start ' + (upgrade ? 'upgrading' : 'updating' + '...'))
      c.notify('update', {upgrade})
    } catch (error) {
      this._xoaStateError(error)
      this._waiting = false
    }
  }

  async start () {
    if (this.isStarted()) {
      return
    }
    await this.xoaState()
    await this.isRegistered()
    this._interval = setInterval(() => this.run(), 60 * 60 * 1000)
    this.run()
  }

  stop () {
    if (this._interval) {
      clearInterval(this._interval)
      delete this._interval
    }
    if (this._client) {
      this._client.removeAllListeners()
      if (this._client.status !== 'closed') {
        this._client.close()
      }
    }
  }

  run () {
    if (Date.now() - this._lastRun >= 24 * 60 * 60 * 1000) {
      this.update()
    }
  }

  isStarted () {
    return this._interval
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
    this.emit('log', this._log)
  }

  async getConfiguration () {
    try {
      const c = await this._open()
      const config = await c.call('getConfiguration')
      this._configuration = config
    } catch (error) {
      this._configuration = {}
      this._xoaStateError(error)
    } finally {
      this.emit('configuration', this._configuration)
    }
  }

  async configure (config) {
    try {
      const c = await this._open()
      const config = await c.call('configure', config)
      this._configuration = config
    } catch (error) {
      this._configuration = {}
      this._xoaStateError(error)
    } finally {
      this.emit('configuration', this._configuration)
    }
  }
}

const xoaUpdater = new XoaUpdater()

export const connectStore = (store) => {
  forEach(states, state => xoaUpdater.on(state, () => store.dispatch(xoaUpdaterState(state))))
  xoaUpdater.on('log', log => store.dispatch(xoaUpdaterLog(log)))
  xoaUpdater.on('registerState', registration => store.dispatch(xoaRegisterState(registration)))
  xoaUpdater.on('configuration', configuration => store.dispatch(xoaConfiguration(configuration)))
}

export default xoaUpdater
// .run(function (updater, $rootScope, $state, xoApi) {
//   updater.start()
//   .catch(() => {})

//   $rootScope.$on('$stateChangeStart', function (event, state) {
//     if (Date.now() - updater._xoaStateTS > (60 * 60 * 1000)) {
//       updater.xoaState()
//     }
//     let {user} = xoApi
//     let loggedIn = !!user
//     if (!loggedIn || !updater._xoaState || state.name === 'settings.update') { // no reason to block
//       return
//     } else if (blockXoaAccess(updater._xoaState)) {
//       blockTime || (blockTime = updater._xoaStateTS)
//       updater.xoaState()
//       if (Date.now() - blockTime < (60 * 1000)) { // We have 1 min before blocking for real
//         return
//       }
//       event.preventDefault()
//       $state.go('settings.update')
//     } else {
//       blockTime = undefined
//     }
//   })
// })
