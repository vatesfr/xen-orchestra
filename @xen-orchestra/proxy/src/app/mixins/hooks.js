import assert from 'assert'
import emitAsync from '@xen-orchestra/emit-async'
import EventEmitter from 'events'
import { createLogger } from '@xen-orchestra/log'

const { debug, warn } = createLogger('xo:proxy:hooks')

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
  constructor(app) {
    super()

    // work-around cyclic mixin dependency with Config
    setImmediate(() => {
      // `debounceResource` opens a listener on each method call
      app.config.watch('maxHooksListeners', n => {
        this.setMaxListeners(n)
      })
    })
  }

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
  async start() {
    assert.strictEqual(this._status, 'stopped')
    this._status = 'starting'
    await runHook(this, 'start')
    this.emit((this._status = 'started'))
  }

  // Run *stop* async listeners.
  //
  // They close connections, unmount file systems, save states, etc.
  async stop() {
    assert.strictEqual(this._status, 'started')
    this._status = 'stopping'
    await runHook(this, 'stop')
    this.emit((this._status = 'stopped'))
  }
}
