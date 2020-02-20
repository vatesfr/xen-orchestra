import appConf from 'app-conf'
import asyncIteratorToStream from 'async-iterator-to-stream'
import createLogger from '@xen-orchestra/log'
import path from 'path'
import { AuditCore, Storage } from '@xen-orchestra/audit-core'
import { fromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'

const log = createLogger('xo:xo-server-audit')

const LAST_ID = 'lastId'
class Db extends Storage {
  constructor(db) {
    super()
    this._db = db
  }

  async put(record) {
    await this._db.put(record.id, record)
  }

  async del(id) {
    await this._db.del(id)
  }

  get(id) {
    return this._db.get(id).catch(error => {
      if (!error.notFound) {
        throw error
      }
    })
  }

  async setLastId(id) {
    await this._db.put(LAST_ID, id)
  }

  getLastId() {
    return this.get(LAST_ID)
  }
}

const NAMESPACE = 'audit'
class AuditXoPlugin {
  constructor({ xo }) {
    this._cleaners = []
    this._xo = xo

    this._auditCore = undefined
    this._blockList = undefined
  }

  async load() {
    const cleaners = this._cleaners

    try {
      this._auditCore = new AuditCore(
        new Db(await this._xo.getStore(NAMESPACE))
      )
      this._blockList = (
        await appConf.load('xo-server-audit', {
          appDir: path.join(__dirname, '..'),
        })
      ).blockList

      cleaners.push(() => {
        this._auditCore = undefined
        this._blockList = undefined
      })
    } catch (error) {
      this._auditCore = undefined
      this._blockList = undefined
      throw error
    }

    this._addListener('xo:postCall', this._handleEvent.bind(this, 'apiCall'))
    this._addListener('xo:audit', this._handleEvent.bind(this))

    const getRecords = this._getRecords.bind(this)
    getRecords.description = 'Get records from a passed record ID'
    getRecords.permission = 'admin'
    getRecords.params = {
      id: { type: 'string', optional: true },
      ndjson: { type: 'boolean', optional: true },
    }

    cleaners.push(
      this._xo.addApiMethods({
        audit: {
          getRecords,
        },
      })
    )
  }

  unload() {
    this._cleaners.forEach(cleaner => cleaner())
    this._cleaners.length = 0
  }

  _addListener(event, listener_) {
    const listener = async (...args) => {
      try {
        await listener_(...args)
      } catch (error) {
        log.error(error)
      }
    }
    const xo = this._xo
    xo.on(event, listener)
    this._cleaners.push(() => xo.removeListener(event, listener))
  }

  _handleEvent(event, { userId, userIp, userName, ...data }) {
    if (event !== 'apiCall' || this._blockList.indexOf(data.method) === -1) {
      return this._auditCore.add(
        {
          userId,
          userIp,
          userName,
        },
        event,
        data
      )
    }
  }

  _handleGetRecords(req, res, id) {
    res.set('Content-Type', 'application/json')
    return fromCallback(
      pipeline,
      asyncIteratorToStream(async function*(asyncIterator) {
        for await (const record of asyncIterator) {
          yield JSON.stringify(record)
          yield '\n'
        }
      })(this._auditCore.getFrom(id)),
      res
    )
  }

  async _getRecords({ id, ndjson = false }) {
    if (ndjson) {
      return this._xo
        .registerHttpRequest(this._handleGetRecords.bind(this), id)
        .then($getFrom => ({
          $getFrom,
        }))
    }

    const records = []
    for await (const record of this._auditCore.getFrom(id)) {
      records.push(record)
    }
    return records
  }
}

export default opts => new AuditXoPlugin(opts)
