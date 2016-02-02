import levelup from 'level-party'
import sublevel from 'level-sublevel'
import { ensureDir } from 'fs-promise'

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
    return this._db.then(db => levelHas(db.sublevel(namespace)))
  }
}
