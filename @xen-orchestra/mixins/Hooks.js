const assert = require('assert')
const emitAsync = require('@xen-orchestra/emit-async')
const EventEmitter = require('events')
const { createLogger } = require('@xen-orchestra/log')

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

module.exports = class Hooks extends EventEmitter {
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
