import highland from 'highland'
import { forEach, noop } from '../utils'

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
  constructor (db, namespace) {
    this._db = db
    this._namespace = namespace
  }

  _add (level, message, data) {
    const log = {
      level,
      message,
      data,
      namespace: this._namespace,
      time: Date.now()
    }

    const key = generateUniqueKey(log.time)
    this._db.put(key, log)
    return key
  }

  createReadStream () {
    return highland(this._db.createReadStream())
      .filter(({value}) => value.namespace === this._namespace)
  }

  del (id) {
    if (!Array.isArray(id)) {
      id = [id]
    }
    forEach(id, id => {
      this._db.get(id, (err, value) => {
        if (!err && value.namespace === this._namespace) {
          this._db.del(id, noop)
        }
      })
    })
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
