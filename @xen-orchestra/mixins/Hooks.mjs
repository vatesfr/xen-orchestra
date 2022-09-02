import assert from 'assert'
import emitAsync from '@xen-orchestra/emit-async'
import EventEmitter from 'events'
import { createLogger } from '@xen-orchestra/log'

const { debug, warn } = createLogger('xo:mixins:hooks')

const runHook = async (emitter, hook) => {
  debug(`${hook} start…`)
  await emitAsync.call(
    emitter,
    {
      onError: error => warn(`${hook} failure`, { error }),
    },
    hook
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
  // *startCore* is automatically called if necessary.
  async start() {
    if (this._status === 'stopped') {
      await this.startCore()
    } else {
      assert.strictEqual(this._status, 'core started')
    }
    this._status = 'starting'
    await runHook(this, 'start')
    this.emit((this._status = 'started'))
  }

  // Run *start core* async listeners.
  //
  // They initialize core features of the application (connect to databases,
  // etc.) and should be fast and side-effects free.
  async startCore() {
    assert.strictEqual(this._status, 'stopped')
    this._status = 'starting core'
    await runHook(this, 'start core')
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
