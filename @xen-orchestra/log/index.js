const createTransport = require('./transports/console')
const { LEVELS, resolve } = require('./levels')

const symbol = typeof Symbol !== 'undefined' ? Symbol.for('@xen-orchestra/log') : '@@@xen-orchestra/log'
if (!(symbol in global)) {
  // the default behavior, without requiring `configure` is to avoid
  // logging anything unless it's a real error
  const transport = createTransport()
  const level = resolve(process.env.LOG_LEVEL, LEVELS.WARN)
  global[symbol] = log => log.level >= level && transport(log)
}

// -------------------------------------------------------------------

function Log(data, level, namespace, message, time) {
  this.data = data
  this.level = level
  this.namespace = namespace
  this.message = message
  this.time = time
}

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
    global[symbol](new Log(data, level, this._namespace, message, new Date()))
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
