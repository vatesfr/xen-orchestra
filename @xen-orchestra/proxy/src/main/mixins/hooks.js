import createLogger from '@xen-orchestra/log'
import emitAsync from '@xen-orchestra/emit-async'
import EventEmitter from 'events'
import expect from 'expect'

const { debug, warn } = createLogger('xo:proxy:hooks')

const runHook = (emitter, hook) => {
  debug(`${hook} start…`)
  const promise = emitAsync.call(
    emitter,
    {
      onError: error => warn(`${hook} failure`, { error }),
    },
    hook
  )
  promise.then(() => {
    debug(`${hook} finished`)
  })
  return promise
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
  async start() {
    expect(this._status).toBe('stopped')
    this._status = 'starting'
    await runHook(this, 'start')
    this.emit((this._status = 'started'))
  }

  // Run *stop* async listeners.
  //
  // They close connections, unmount file systems, save states, etc.
  async stop() {
    expect(this._status).toBe('started')
    this._status = 'stopping'
    await runHook(this, 'stop')
    this.emit((this._status = 'stopped'))
  }
}
