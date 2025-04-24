import forEach from 'lodash/forEach'
import fromEvents from 'promise-toolbox/fromEvents'
import makeError from 'make-error'
import map from 'lodash/map'
import { AbortedConnection, ConnectionError, JsonRpcWebSocketClient as Client } from 'jsonrpc-websocket-client'
import { EventEmitter } from 'events'
import {
  setXoaConfiguration,
  setXoaRegisterState,
  setXoaTrialState,
  setXoaUpdaterLog,
  setXoaUpdaterState,
} from 'store/actions'

// ===================================================================

const states = ['disconnected', 'updating', 'upgrading', 'upToDate', 'upgradeNeeded', 'registerNeeded', 'error']

// ===================================================================

export function isTrialRunning(trial) {
  return trial && trial.end && Date.now() < trial.end
}

export function exposeTrial(trial) {
  // We won't suggest trial if any trial is running now, or if premium was enjoyed in any past trial
  return !(trial && (isTrialRunning(trial) || trial.plan === 'premium'))
}

export function blockXoaAccess(xoaState) {
  let block = xoaState.state === 'untrustedTrial'
  if (process.env.XOA_PLAN <= 1 || process.env.XOA_PLAN >= 5) {
    block = block || xoaState.state === 'ERROR'
  }
  return block
}

export function getLicenseNearExpiration(licenses) {
  if (licenses.find(({ expires }) => expires === undefined) !== undefined) {
    return
  }
  if (licenses.length === 0) {
    throw new Error('No license found')
  }

  licenses.sort(({ expires: expires1 }, { expires: expires2 }) => expires2 - expires1)
  const newestLicense = licenses[0]

  const SLOTS = [
    {
      strCode: 'licenseNearlyExpired',
      textDuration: '3 months',
      duration: -90 * 24 * 3600 * 1000,
      popupClass: 'alert-info',
    },
    {
      strCode: 'licenseNearlyExpired',
      textDuration: '2 months',
      duration: -60 * 24 * 3600 * 1000,
      popupClass: 'alert-info',
    },
    {
      strCode: 'licenseNearlyExpired',
      textDuration: '1 month',
      duration: -30 * 24 * 3600 * 1000,
      popupClass: 'alert-danger',
    },
    {
      strCode: 'licenseNearlyExpired',
      textDuration: '1 week',
      duration: -7 * 24 * 3600 * 1000,
      popupClass: 'alert-danger',
    },
    {
      strCode: 'licenseExpired',
      code: 'EXPIRED',
      duration: 0,
      blocked: true,
    },
  ]
  const candidates = SLOTS.filter(({ duration }) => newestLicense.expires + duration < Date.now())

  if (candidates.length === 0) {
    // no license near expiration
    return
  }

  // only show the most recent expire slot
  candidates.sort(({ duration: duration1 }, { duration: duration2 }) => {
    return duration2 - duration1
  })
  return {
    ...candidates[0],
    license: newestLicense,
  }
}

// ===================================================================

export const NotRegistered = makeError('NotRegistered')

class XoaUpdater extends EventEmitter {
  constructor() {
    super()
    this._waiting = false
    this._log = []
    this._lastRun = 0
    this._lowState = null
    this.state('disconnected')
    this.registerError = ''
    this._configuration = {}
  }

  state(state) {
    this._state = state
    this.emit(state, this._lowState && this._lowState.source)
  }

  async update() {
    if (this._waiting) {
      return
    }
    this._waiting = true
    this.state('updating')
    this._update(false)
  }

  async upgrade() {
    if (this._waiting) {
      return
    }
    this._waiting = true
    this.state('upgrading')
    await this._update(true)
  }

  _upgradeSuccessful() {
    this.emit('upgradeSuccessful', this._lowState && this._lowState.source)
  }

  async _open() {
    const openFailure = error => {
      switch (true) {
        case error instanceof AbortedConnection:
          this.log('error', 'AbortedConnection')
          break
        case error instanceof ConnectionError:
          this.log('error', 'ConnectionError')
          break
        default:
          this.log('error', error)
      }
      delete this._client
      this.state('disconnected')
      throw error
    }

    const handleOpen = c => {
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

      middle.on('print', ({ content }) => {
        Array.isArray(content) || (content = [content])
        content.forEach(elem => this.log('info', elem))
        this.emit('print', content)
      })
      middle.on('end', end => {
        this._lowState = end
        const { state } = end
        if (state.endsWith('-upgrade-needed')) {
          this.state('upgradeNeeded')
        } else {
          switch (state) {
            case 'xoa-up-to-date':
            case 'xoa-upgraded':
            case 'updater-upgraded':
            case 'installer-upgraded':
              this.state('upToDate')
              break
            case 'register-needed':
              this.state('registerNeeded')
              break
            default:
              this.state('error')
          }
        }
        this.log(end.level, end.message)
        this._lastRun = Date.now()
        this._waiting = false
        this.emit('end', end)
        if (state === 'register-needed') {
          this.isRegistered()
        } else if (state === 'updater-upgraded' || state === 'installer-upgraded') {
          this.update()
        } else if (state === 'xoa-upgraded') {
          this._upgradeSuccessful()
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
        delete this._client
        const message = 'xoa-updater could not be reached'
        this._xoaStateError({ message })
        this.log('error', message)
        this.emit('disconnected')
      })

      this.update()
      this.isRegistered()
      this.getConfiguration()
      return c
    }

    if (!this._client) {
      try {
        this._client = new Client('./api/updater')
        await this._client.open()
        handleOpen(this._client)
      } catch (error) {
        openFailure(error)
      }
    }
    const c = this._client
    if (c.status === 'open') {
      return c
    } else {
      return fromEvents(c, ['open'], ['closed', 'error']).then(() => c)
    }
  }

  async isRegistered() {
    try {
      const token = await this._call('isRegistered')
      if (token.registrationToken === undefined) {
        throw new NotRegistered('Your Xen Orchestra Appliance is not registered')
      } else {
        this.registerState = 'registered'
        this.token = token
        return token
      }
    } catch (error) {
      delete this.token
      if (error instanceof NotRegistered) {
        this.registerState = 'unregistered'
      } else {
        this.registerError = error.message
        this.registerState = 'error'
      }
    } finally {
      this.emit('registerState', {
        state: this.registerState,
        email: (this.token && this.token.registrationEmail) || '',
        error: this.registerError,
      })
    }
  }

  getLocalManifest() {
    return this._call('getLocalManifest')
  }

  async register(email, password, renew = false) {
    try {
      const token = await this._call('register', { email, password, renew })
      this.registerState = 'registered'
      this.registerError = ''
      this.token = token
      return token
    } catch (error) {
      if (!renew) {
        delete this.token
      }
      if (error.code && error.code === 1) {
        this.registerError = 'Authentication failed'
      } else {
        this.registerError = error.message
        this.registerState = 'error'
      }
    } finally {
      this.emit('registerState', {
        state: this.registerState,
        email: (this.token && this.token.registrationEmail) || '',
        error: this.registerError,
      })
      if (this.registerState === 'registered') {
        this.update()
      }
    }
  }

  async requestTrial() {
    const state = await this.xoaState()
    if (!state.state === 'ERROR') {
      throw new Error(state.message)
    }
    if (isTrialRunning(state.trial)) {
      throw new Error('You are already under trial')
    }
    try {
      return await this._call('requestTrial', { trialPlan: 'premium' })
    } finally {
      await this.xoaState()
    }
  }

  async xoaState() {
    try {
      const state = await this._call('xoaState')
      this._xoaState = state
      return state
    } catch (error) {
      return this._xoaStateError(error)
    } finally {
      this.emit('trialState', Object.assign({}, this._xoaState))
    }
  }

  _xoaStateError(error) {
    const message = error.message || String(error)
    this._xoaState = {
      state: 'ERROR',
      message,
    }
    return this._xoaState
  }

  async _update(upgrade = false) {
    try {
      const c = await this._open()
      this.log('info', 'Start ' + (upgrade ? 'upgrading' : 'updating' + '...'))
      c.notify('update', { upgrade })
    } catch (error) {
      this._waiting = false
    }
  }

  async start() {
    if (this.isStarted()) {
      return
    }
    await this.xoaState()
    await this.isRegistered()
    this._interval = setInterval(() => this.run(), 60 * 60 * 1000)
    this.run()
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval)
      delete this._interval
    }
    if (this._client) {
      this._client.removeAllListeners()
      if (this._client.status !== 'closed') {
        this._client.close()
      }
      delete this._client
    }
    this.state('disconnected')
  }

  run() {
    if (Date.now() - this._lastRun >= 24 * 60 * 60 * 1000) {
      this.update()
    }
  }

  isStarted() {
    return this._interval
  }

  log(level, message) {
    message = (message != null && message.message) || String(message)
    const date = new Date()
    this._log.push({
      date: date.toLocaleString(),
      level,
      message,
    })
    while (this._log.length > 10) {
      this._log.shift()
    }
    this.emit(
      'log',
      map(this._log, item => Object.assign({}, item))
    )
  }

  async getConfiguration() {
    try {
      this._configuration = await this._call('getConfiguration')
      return this._configuration
    } catch (error) {
      this._configuration = {}
    } finally {
      this.emit('configuration', Object.assign({}, this._configuration))
    }
  }

  getReleaseChannels() {
    return this._call('getReleaseChannels').catch(error => {
      console.error('getReleaseChannels', error)
      return {}
    })
  }

  async _call(...args) {
    const c = await this._open()
    try {
      return await c.call(...args)
    } catch (error) {
      this.log('error', error)
      throw error
    }
  }

  async configure(config) {
    try {
      this._configuration = await this._call('configure', config)
      this.update()
      return this._configuration
    } catch (error) {
      this._configuration = {}
    } finally {
      this.emit('configuration', Object.assign({}, this._configuration))
    }
  }
}

const xoaUpdater = new XoaUpdater()

export default xoaUpdater

export const connectStore = store => {
  forEach(states, state => xoaUpdater.on(state, () => store.dispatch(setXoaUpdaterState(state))))
  xoaUpdater.on('trialState', state => store.dispatch(setXoaTrialState(state)))
  xoaUpdater.on('log', log => store.dispatch(setXoaUpdaterLog(log)))
  xoaUpdater.on('registerState', registration => store.dispatch(setXoaRegisterState(registration)))
  xoaUpdater.on('configuration', configuration => store.dispatch(setXoaConfiguration(configuration)))
}
