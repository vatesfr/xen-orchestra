'use strict'

const createConsoleTransport = require('./transports/console')
const createTransport = require('./_createTransport')
const symbol = require('./_symbol.js')
const { LEVELS, resolve } = require('./_levels')

// ===================================================================

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
