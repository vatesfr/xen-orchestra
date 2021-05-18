const createConsoleTransport = require('./transports/console')
const { LEVELS, resolve } = require('./levels')
const { compileGlobPattern } = require('./utils')

// ===================================================================

const createTransport = config => {
  if (typeof config === 'function') {
    return config
  }

  if (Array.isArray(config)) {
    const transports = config.map(createTransport)
    const { length } = transports
    return function () {
      for (let i = 0; i < length; ++i) {
        transports[i].apply(this, arguments)
      }
    }
  }

  let { filter } = config
  let transport = createTransport(config.transport)
  const level = resolve(config.level)

  if (filter !== undefined) {
    if (typeof filter === 'string') {
      const re = compileGlobPattern(filter)
      filter = log => re.test(log.namespace)
    }

    const orig = transport
    transport = function (log) {
      if ((level !== undefined && log.level >= level) || filter(log)) {
        return orig.apply(this, arguments)
      }
    }
  } else if (level !== undefined) {
    const orig = transport
    transport = function (log) {
      if (log.level >= level) {
        return orig.apply(this, arguments)
      }
    }
  }

  return transport
}

const symbol = typeof Symbol !== 'undefined' ? Symbol.for('@xen-orchestra/log') : '@@@xen-orchestra/log'

const { env } = process
global[symbol] = createTransport({
  // display warnings or above, and all that are enabled via DEBUG or
  // NODE_DEBUG env
  filter: [env.DEBUG, env.NODE_DEBUG].filter(Boolean).join(','),
  level: resolve(env.LOG_LEVEL, LEVELS.INFO),

  transport: createConsoleTransport(),
})

const configure = config => {
  global[symbol] = createTransport(config)
}
exports.configure = configure

// -------------------------------------------------------------------

const catchGlobalErrors = logger => {
  // patch process
  const onUncaughtException = error => {
    logger.error('uncaught exception', { error })
  }
  const onUnhandledRejection = error => {
    logger.warn('possibly unhandled rejection', { error })
  }
  const onWarning = error => {
    logger.warn('Node warning', { error })
  }
  process.on('uncaughtException', onUncaughtException)
  process.on('unhandledRejection', onUnhandledRejection)
  process.on('warning', onWarning)

  // patch EventEmitter
  const EventEmitter = require('events')
  const { prototype } = EventEmitter
  const { emit } = prototype
  function patchedEmit(event, error) {
    if (event === 'error' && this.listenerCount(event) === 0) {
      logger.error('unhandled error event', { error })
      return false
    }
    return emit.apply(this, arguments)
  }
  prototype.emit = patchedEmit

  return () => {
    process.removeListener('uncaughtException', onUncaughtException)
    process.removeListener('unhandledRejection', onUnhandledRejection)
    process.removeListener('warning', onWarning)

    if (prototype.emit === patchedEmit) {
      prototype.emit = emit
    }
  }
}
exports.catchGlobalErrors = catchGlobalErrors
