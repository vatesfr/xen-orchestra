import endsWith from 'lodash.endswith'
import levelup from 'level-party'
import startsWith from 'lodash.startswith'
import sublevel from 'level-sublevel'
import { ensureDir } from 'fs-promise'

import {
  forEach,
  isFunction,
  promisify
} from '../utils'

// ===================================================================

const _levelHas = function has (key, cb) {
  if (cb) {
    return this.get(key, (error, value) => error
      ? (
        error.notFound
          ? cb(null, false)
          : cb(error)
        )
      : cb(null, true)
    )
  }

  try {
    this.get(key)
    return true
  } catch (error) {
    if (!error.notFound) {
      throw error
    }
  }
  return false
}
const levelHas = db => {
  db.has = _levelHas

  return db
}

const levelPromise = db => {
  const dbP = {}
  forEach(db, (value, name) => {
    if (!isFunction(value)) {
      return
    }

    if (
      endsWith(name, 'Stream') ||
      startsWith(name, 'is')
    ) {
      dbP[name] = db::value
    } else {
      dbP[`${name}Sync`] = db::value
      dbP[name] = value::promisify(db)
    }
  })

  return dbP
}

// ===================================================================

export default class {
  constructor (xo) {
    const dir = `${xo._config.datadir}/leveldb`
    this._db = ensureDir(dir).then(() => {
      return sublevel(levelup(dir, {
        valueEncoding: 'json'
      }))
    })
  }

  getStore (namespace) {
    return this._db.then(db => levelPromise(
      levelHas(db.sublevel(namespace))
    ))
  }
}
