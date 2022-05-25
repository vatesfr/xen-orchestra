import fse from 'fs-extra'
import jsonStringifySafe from 'json-stringify-safe'
import levelup from 'level-party'
import sublevel from 'subleveldown'
import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo:store')

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

const valueEncoding = {
  buffer: false,
  decode: JSON.parse,
  encode: data => {
    try {
      return JSON.stringify(data)
    } catch (error) {
      log.warn(error)

      // attempts to stringify by removing circular references
      return jsonStringifySafe(data)
    }
  },
  type: 'safe-json',
}

export default class {
  constructor(app) {
    const dir = `${app.config.get('datadir')}/leveldb`
    this._db = (async () => {
      await fse.ensureDir(dir)
      await fse.access(dir, fse.constants.R_OK | fse.constants.W_OK)
      return levelup(dir)
    })()
  }

  async getStore(namespace) {
    return levelHas(sublevel(await this._db, namespace, { valueEncoding }))
  }
}
