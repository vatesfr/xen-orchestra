// See: https://en.wikipedia.org/wiki/Syslog#Severity_level
const LEVELS = [
  'emergency',
  'alert',
  'critical',
  'error',
  'warning',
  'notice',
  'informational',
  'debug'
]

let lastDate = 0
let lastId = 0

function generateUniqueKey (date) {
  lastId = (date === lastDate) ? (lastId + 1) : 0
  lastDate = date

  return `${lastDate}:${lastId}`
}

export default class LevelDbLogger {
  constructor (db) {
    this._db = db
  }

  _add (level, message, data) {
    const log = {
      level,
      message,
      data,
      time: Date.now()
    }

    const key = generateUniqueKey(log.time)
    this._db.put(key, log)
    return key
  }

  createReadStream () {
    return this._db.createReadStream()
  }
}

// Create high level log methods.
for (const level of LEVELS) {
  Object.defineProperty(LevelDbLogger.prototype, level, {
    value (message, data) {
      return this._add(level, message, data)
    }
  })
}
