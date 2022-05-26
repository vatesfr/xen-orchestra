import highland from 'highland'
import { ignoreErrors } from 'promise-toolbox'

import AbstractLogger from './abstract.mjs'

import { forEach, noop } from '../../../utils.mjs'

let lastDate = 0
let increment = 0

function generateUniqueKey(date) {
  if (date === lastDate) {
    return `${date}:${increment++}`
  }

  increment = 0
  return String((lastDate = date))
}

export default class LevelDbLogger extends AbstractLogger {
  constructor(db, namespace) {
    super()

    this._db = db
    this._namespace = namespace
  }

  _add(level, message, data, returnPromise = false) {
    const time = Date.now()

    const log = {
      level,
      message,
      data,
      namespace: this._namespace,
      time,
    }

    const key = generateUniqueKey(time)

    const promise = this._db.put(key, log)

    if (returnPromise) {
      return promise.then(() => key)
    }

    promise::ignoreErrors()
    return key
  }

  createReadStream() {
    return highland(this._db.createReadStream()).filter(({ value }) => value.namespace === this._namespace)
  }

  del(id) {
    forEach(Array.isArray(id) ? id : [id], id => {
      this._db.get(id).then(value => {
        if (value.namespace === this._namespace) {
          this._db.del(id, noop)
        }
      })
    })
  }
}
