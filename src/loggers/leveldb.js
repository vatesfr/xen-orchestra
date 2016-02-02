import highland from 'highland'

import AbstractLogger from './abstract'
import { forEach, noop } from '../utils'

let lastDate = 0
let lastId = 0

function generateUniqueKey (date) {
  lastId = (date === lastDate) ? (lastId + 1) : 0
  lastDate = date

  return `${lastDate}:${lastId}`
}

export default class LevelDbLogger extends AbstractLogger {
  constructor (db, namespace) {
    super()

    this._db = db
    this._namespace = namespace
  }

  _add (level, message, data) {
    const time = Date.now()

    const log = {
      level,
      message,
      data,
      namespace: this._namespace,
      time
    }

    const key = generateUniqueKey(time)
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
