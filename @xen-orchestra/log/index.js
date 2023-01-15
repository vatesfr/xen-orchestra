'use strict'

const compileGlobPattern = require('./_compileGlobPattern.js')
const createTransport = require('./transports/console')
const Log = require('./_Log')
const { LEVELS, resolve } = require('./_levels')

const symbol = typeof Symbol !== 'undefined' ? Symbol.for('@xen-orchestra/log') : '@@@xen-orchestra/log'
if (!(symbol in global)) {
  // the default behavior, without requiring `configure` is to avoid
  // logging anything unless it's a real error
  const transport = createTransport()

  const { env } = process

  const pattern = [env.DEBUG, env.NODE_DEBUG].filter(Boolean).join(',')
  const matchDebug = pattern.length !== 0 ? RegExp.prototype.test.bind(compileGlobPattern(pattern)) : () => false

  const level = resolve(env.LOG_LEVEL, LEVELS.WARN)

  global[symbol] = function conditionalTransport(log) {
    if (log.level >= level || matchDebug(log.namespace)) {
      transport(log)
    }
  }
}

// -------------------------------------------------------------------

function Logger(namespace) {
  this._namespace = namespace

  // bind all logging methods
  for (const name in LEVELS) {
    const lowerCase = name.toLowerCase()
    this[lowerCase] = this[lowerCase].bind(this)
  }
}

const { prototype } = Logger

for (const name in LEVELS) {
  const level = LEVELS[name]

  prototype[name.toLowerCase()] = function (message, data) {
    if (typeof message !== 'string') {
      if (message instanceof Error) {
        data = { error: message }
        ;({ message = 'an error has occurred' } = message)
      } else {
        return this.warn('incorrect value passed to logger', {
          level,
          value: message,
        })
      }
    }
    global[symbol](new Log(data, level, this._namespace, message))
  }
}

prototype.wrap = function (message, fn) {
  const logger = this
  const warnAndRethrow = error => {
    logger.warn(message, { error })
    throw error
  }
  return function () {
    try {
      const result = fn.apply(this, arguments)
      const then = result != null && result.then
      return typeof then === 'function' ? then.call(result, warnAndRethrow) : result
    } catch (error) {
      warnAndRethrow(error)
    }
  }
}

const createLogger = namespace => new Logger(namespace)

module.exports = exports = createLogger
exports.createLogger = createLogger
