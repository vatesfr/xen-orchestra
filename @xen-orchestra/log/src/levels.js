const LEVELS = Object.create(null)
export { LEVELS as default }

// https://github.com/trentm/node-bunyan#levels
LEVELS.FATAL = 60 // service/app is going to down
LEVELS.ERROR = 50 // fatal for current action
LEVELS.WARN = 40 // something went wrong but it's not fatal
LEVELS.INFO = 30 // detail on unusual but normal operation
LEVELS.DEBUG = 20

export const NAMES = Object.create(null)
for (const name in LEVELS) {
  NAMES[LEVELS[name]] = name
}

export const resolve = level => {
  if (typeof level === 'string') {
    level = LEVELS[level.toUpperCase()]
  }
  return level
}

Object.freeze(LEVELS)
Object.freeze(NAMES)
