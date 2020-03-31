import asyncIteratorToStream from 'async-iterator-to-stream'
import createLogger from '@xen-orchestra/log'
import { alteredAuditRecord, missingAuditRecord } from 'xo-common/api-errors'
import { createGzip } from 'zlib'
import { fromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'
import {
  AlteredRecordError,
  AuditCore,
  MissingRecordError,
  NULL_ID,
  Storage,
} from '@xen-orchestra/audit-core'

const log = createLogger('xo:xo-server-audit')

const DEFAULT_BLOCKED_LIST = {
  'acl.get': true,
  'acl.getCurrentPermissions': true,
  'audit.checkIntegrity': true,
  'audit.generateFingerprint': true,
  'audit.getRecords': true,
  'backupNg.getAllJobs': true,
  'backupNg.getAllLogs': true,
  'cloud.getResourceCatalog': true,
  'cloudConfig.getAll': true,
  'group.getAll': true,
  'host.stats': true,
  'ipPool.getAll': true,
  'job.getAll': true,
  'log.get': true,
  'metadataBackup.getAllJobs': true,
  'plugin.get': true,
  'pool.listMissingPatches': true,
  'proxy.getAll': true,
  'remote.getAll': true,
  'remote.getAllInfo': true,
  'resourceSet.getAll': true,
  'role.getAll': true,
  'schedule.getAll': true,
  'server.getAll': true,
  'session.getUser': true,
  'session.signIn': true,
  'sr.getUnhealthyVdiChainsLength': true,
  'sr.stats': true,
  'system.getMethodsInfo': true,
  'system.getServerTimezone': true,
  'system.getServerVersion': true,
  'user.getAll': true,
  'vm.stats': true,
  'xo.getAllObjects': true,
  'xoa.supportTunnel.getState': true,
  'xosan.checkSrCurrentState': true,
  'xosan.getVolumeInfo': true,
}

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
  constructor({ staticConfig, xo }) {
    this._blockedList = {
      ...DEFAULT_BLOCKED_LIST,
      ...staticConfig.blockedList,
    }
    this._cleaners = []
    this._xo = xo

    this._auditCore = undefined
    this._storage = undefined
  }

  async load() {
    const storage = (this._storage = new Db(await this._xo.getStore(NAMESPACE)))
    this._auditCore = new AuditCore(storage)

    const cleaners = this._cleaners
    cleaners.push(() => {
      this._auditCore = undefined
      this._storage = undefined
    })

    this._addListener('xo:postCall', this._handleEvent.bind(this, 'apiCall'))
    this._addListener('xo:audit', this._handleEvent.bind(this))

    const exportRecords = this._exportRecords.bind(this)
    exportRecords.permission = 'admin'

    const getRecords = this._getRecords.bind(this)
    getRecords.description = 'Get records from a passed record ID'
    getRecords.permission = 'admin'
    getRecords.params = {
      id: { type: 'string', optional: true },
      ndjson: { type: 'boolean', optional: true },
    }

    const checkIntegrity = this._checkIntegrity.bind(this)
    checkIntegrity.description =
      'Check records integrity between oldest and newest'
    checkIntegrity.permission = 'admin'
    checkIntegrity.params = {
      newest: { type: 'string', optional: true },
      oldest: { type: 'string', optional: true },
    }

    const generateFingerprint = this._generateFingerprint.bind(this)
    generateFingerprint.description =
      'Generate a fingerprint of the chain oldest-newest'
    generateFingerprint.permission = 'admin'
    generateFingerprint.params = {
      newest: { type: 'string', optional: true },
      oldest: { type: 'string', optional: true },
    }

    cleaners.push(
      this._xo.addApiMethods({
        audit: {
          checkIntegrity,
          exportRecords,
          generateFingerprint,
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
    if (event !== 'apiCall' || !this._blockedList[data.method]) {
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

  async _getRecords({ id, ndjson = false }) {
    if (ndjson) {
      return this._xo
        .registerHttpRequest((req, res) => {
          res.set('Content-Type', 'application/json')
          return fromCallback(pipeline, this._getRecordsStream(id), res)
        })
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

  _exportRecords() {
    return this._xo
      .registerHttpRequest(
        (req, res) => {
          res.set({
            'content-disposition': 'attachment',
            'content-type': 'application/json',
          })
          return fromCallback(
            pipeline,
            this._getRecordsStream(),
            createGzip(),
            res
          )
        },
        undefined,
        {
          suffix: `/audit-records-${new Date()
            .toISOString()
            .replace(/:/g, '_')}.gz`,
        }
      )
      .then($getFrom => ({
        $getFrom,
      }))
  }

  async _checkIntegrity(props) {
    const { oldest = NULL_ID, newest = await this._storage.getLastId() } = props
    return this._auditCore.checkIntegrity(oldest, newest).catch(error => {
      if (error instanceof MissingRecordError) {
        throw missingAuditRecord(error)
      }
      if (error instanceof AlteredRecordError) {
        throw alteredAuditRecord(error)
      }
      throw error
    })
  }

  async _generateFingerprint(props) {
    const { oldest = NULL_ID, newest = await this._storage.getLastId() } = props
    try {
      return {
        fingerprint: `${oldest}|${newest}`,
        nValid: await this._checkIntegrity({ oldest, newest }),
      }
    } catch (error) {
      if (missingAuditRecord.is(error) || alteredAuditRecord.is(error)) {
        return {
          fingerprint: `${error.data.id}|${newest}`,
          nValid: error.data.nValid,
          error,
        }
      }
      throw error
    }
  }
}

AuditXoPlugin.prototype._getRecordsStream = asyncIteratorToStream(
  async function*(id) {
    for await (const record of this._auditCore.getFrom(id)) {
      yield JSON.stringify(record)
      yield '\n'
    }
  }
)

export default opts => new AuditXoPlugin(opts)
