import createLogger from 'debug'

const debug = createLogger('xo:hooks')

function emitAsync (event) {
  let opts
  let i = 1

  // an option object has been passed as first param
  if (typeof event !== 'string') {
    opts = event
    event = arguments[i++]
  }

  const n = arguments.length - i
  const args = new Array(n)
  for (let j = 0; j < n; ++j) {
    args[j] = arguments[j + i]
  }

  const onError = opts != null && opts.onError

  return Promise.all(this.listeners(event).map(
    listener => new Promise(resolve => {
      resolve(listener.apply(this, args))
    }).catch(onError)
  ))
}

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
  debug(`${hook} start…`)
  const promise = emitAsync.call(app, {
    onError: error => console.error(
      `[WARN] hook ${hook} failure:`,
      (error != null && error.stack) || error
    ),
  }, hook)
  promise.then(() => {
    debug(`${hook} finished`)
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
