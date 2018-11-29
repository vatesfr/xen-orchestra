import createLogger from '@xen-orchestra/log'
import emitAsync from '@xen-orchestra/emit-async'

const log = createLogger('xo:xo-mixins:hooks')

const makeSingletonHook = (hook, postEvent) => {
  let promise
  return function () {
    if (promise === undefined) {
      promise = runHook(this, hook)
      promise.then(() => {
        this.removeAllListeners(hook)
        this.emit(postEvent)
        this.removeAllListeners(postEvent)
      })
    }
    return promise
  }
}

const runHook = (app, hook) => {
  log.debug(`${hook} start…`)
  const promise = emitAsync.call(
    app,
    {
      onError: error => log.warn(`hook ${hook} failure:`, { error }),
    },
    hook
  )
  promise.then(() => {
    log.debug(`${hook} finished`)
  })
  return promise
}

export default {
  // Run *clean* async listeners.
  //
  // They normalize existing data, clear invalid entries, etc.
  clean () {
    return runHook(this, 'clean')
  },

  // Run *start* async listeners.
  //
  // They initialize the application.
  start: makeSingletonHook('start', 'started'),

  // Run *stop* async listeners.
  //
  // They close connections, unmount file systems, save states, etc.
  stop: makeSingletonHook('stop', 'stopped'),
}
