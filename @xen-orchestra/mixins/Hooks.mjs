import assert from 'assert'
import EventEmitter from 'events'
import { createLogger } from '@xen-orchestra/log'

const { debug, warn } = createLogger('xo:mixins:hooks')

const noop = Function.prototype

const runHook = async (emitter, hook, onResult = noop) => {
  debug(`${hook} start…`)
  const listeners = emitter.listeners(hook)
  await Promise.all(
    listeners.map(async listener => {
      const handle = setInterval(() => {
        warn(
          `${hook} ${listener.name || 'anonymous'} listener is still running`,
          listener.name ? undefined : { source: listener.toString() }
        )
      }, 5e3)
      try {
        onResult(await listener.call(emitter))
      } catch (error) {
        warn(`${hook} failure`, { error })
      } finally {
        clearInterval(handle)
      }
    })
  )
  debug(`${hook} finished`)
}

export default class Hooks extends EventEmitter {
  // Run *clean* async listeners.
  //
  // They normalize existing data, clear invalid entries, etc.
  clean() {
    return runHook(this, 'clean')
  }

  _status = 'stopped'

  // Run *start* async listeners.
  //
  // They initialize the application.
  //
  // A *start* listener can return a teardown function which will be added as a
  // one-time listener for the *stop* event.
  //
  // *startCore* is automatically called if necessary.
  async start() {
    if (this._status === 'stopped') {
      await this.startCore()
    } else {
      assert.strictEqual(this._status, 'core started')
    }
    this._status = 'starting'
    await runHook(this, 'start', result => {
      if (typeof result === 'function') {
        this.once('stop', result)
      }
    })
    this.emit((this._status = 'started'))
  }

  // Run *start core* async listeners.
  //
  // They initialize core features of the application (connect to databases,
  // etc.) and should be fast and side-effects free.
  //
  // A *start core* listener can return a teardown function which will be added
  // as a one-time listener for the *stop core* event.
  async startCore() {
    assert.strictEqual(this._status, 'stopped')
    this._status = 'starting core'
    await runHook(this, 'start core', result => {
      if (typeof result === 'function') {
        this.once('stop core', result)
      }
    })
    this.emit((this._status = 'core started'))
  }

  // Run *stop*  async listeners if necessary and *stop core* listeners.
  //
  // They close connections, unmount file systems, save states, etc.
  async stop() {
    if (this._status !== 'core started') {
      assert.strictEqual(this._status, 'started')
      this._status = 'stopping'
      await runHook(this, 'stop')
      this._status = 'core started'
    }
    await runHook(this, 'stop core')
    this.emit((this._status = 'stopped'))
  }
}
