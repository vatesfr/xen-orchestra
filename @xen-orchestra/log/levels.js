'use strict'

const LEVELS = Object.create(null)
exports.LEVELS = LEVELS

// https://github.com/trentm/node-bunyan#levels
LEVELS.FATAL = 60 // service/app is going down
LEVELS.ERROR = 50 // fatal for current action
LEVELS.WARN = 40 // something went wrong but it's not fatal
LEVELS.INFO = 30 // detail on unusual but normal operation
LEVELS.DEBUG = 20

const NAMES = Object.create(null)
exports.NAMES = NAMES
for (const name in LEVELS) {
  NAMES[LEVELS[name]] = name
}

/**
 * Resolves the number representation of a level
 *
 * @param {number|string} level
 * @param {number} [defaultLevel]
 * @returns If the passed level is not valid, defaultLevel is returned
 */
function resolve(level, defaultLevel) {
  const type = typeof level
  if (type === 'number') {
    if (level in NAMES) {
      return level
    }
  } else if (type === 'string') {
    const nLevel = LEVELS[level.toUpperCase()]
    if (nLevel !== undefined) {
      return nLevel
    }
  }
  return defaultLevel
}
exports.resolve = resolve

Object.freeze(LEVELS)
Object.freeze(NAMES)
