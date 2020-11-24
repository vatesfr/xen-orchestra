import levelup from 'level-party'
import sublevel from 'subleveldown'
import { ensureDir } from 'fs-extra'

// ===================================================================

const _levelHas = async function has(key, cb) {
  if (cb) {
    return this.get(key, (error, value) => (error ? (error.notFound ? cb(null, false) : cb(error)) : cb(null, true)))
  }

  try {
    await this.get(key)
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
  constructor(xo, config) {
    const dir = `${config.datadir}/leveldb`
    this._db = ensureDir(dir).then(() => levelup(dir))
  }

  async getStore(namespace) {
    return levelHas(
      sublevel(await this._db, namespace, {
        valueEncoding: 'json',
      })
    )
  }
}
