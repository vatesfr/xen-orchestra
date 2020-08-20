import asyncIteratorToStream from 'async-iterator-to-stream'
import createLogger from '@xen-orchestra/log'
import { alteredAuditRecord, missingAuditRecord } from 'xo-common/api-errors'
import { createGzip } from 'zlib'
import { createSchedule } from '@xen-orchestra/cron'
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
  'backup.list': true,
  'backupNg.getAllJobs': true,
  'backupNg.getAllLogs': true,
  'backupNg.listVmBackups': true,
  'cloud.getResourceCatalog': true,
  'cloudConfig.getAll': true,
  'group.getAll': true,
  'host.isHostServerTimeConsistent': true,
  'host.isHyperThreadingEnabled': true,
  'host.stats': true,
  'ipPool.getAll': true,
  'job.getAll': true,
  'log.get': true,
  'metadataBackup.getAllJobs': true,
  'network.getBondModes': true,
  'pif.getIpv4ConfigurationModes': true,
  'plugin.get': true,
  'pool.listMissingPatches': true,
  'proxy.getAll': true,
  'remote.getAll': true,
  'remote.getAllInfo': true,
  'remote.list': true,
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
  'vm.getHaValues': true,
  'vm.stats': true,
  'xo.getAllObjects': true,
  'xoa.getApplianceInfo': true,
  'xoa.licenses.get': true,
  'xoa.licenses.getAll': true,
  'xoa.licenses.getSelf': true,
  'xoa.supportTunnel.getState': true,
  'xosan.checkSrCurrentState': true,
  'xosan.computeXosanPossibleOptions': true,
  'xosan.getVolumeInfo': true,
}

const LAST_ID = 'lastId'

// interface Db {
//   lastId: string
//   [RecordId: string]: {
//     data: object
//     event: string
//     id: strings
//     previousId: string
//     subject: {
//       userId: string
//       userIp: string
//       userName: string
//     }
//     time: number
//   }
// }
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

export const configurationSchema = {
  type: 'object',
  properties: {
    active: {
      description: 'Whether to save user actions in the audit log',
      type: 'boolean',
    },
  },
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

    const {
      enabled = true,
      schedule = {
        cron: '0 6 * * *',
      },
    } = staticConfig.lastHashUpload ?? {}

    if (enabled) {
      this._uploadLastHashJob = createSchedule(
        schedule.cron,
        schedule.timezone
      ).createJob(() => this._uploadLastHash().catch(log.error))
    }

    this._auditCore = undefined
    this._storage = undefined

    this._listeners = {
      'xo:audit': this._handleEvent.bind(this),
      'xo:postCall': this._handleEvent.bind(this, 'apiCall'),
    }
  }

  configure({ active = false }, { loaded }) {
    this._active = active

    if (loaded) {
      this._addListeners()
    }
  }

  async load() {
    const storage = (this._storage = new Db(await this._xo.getStore(NAMESPACE)))
    this._auditCore = new AuditCore(storage)

    const cleaners = this._cleaners
    cleaners.push(() => {
      this._auditCore = undefined
      this._storage = undefined
    })

    this._addListeners()

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

    const uploadLastHashJob = this._uploadLastHashJob
    if (uploadLastHashJob !== undefined) {
      uploadLastHashJob.start()
      cleaners.push(() => uploadLastHashJob.stop())
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
    this._removeListeners()
    this._cleaners.forEach(cleaner => cleaner())
    this._cleaners.length = 0
  }

  _addListeners(event, listener_) {
    this._removeListeners()

    if (this._active) {
      const listeners = this._listeners
      Object.keys(listeners).forEach(event => {
        this._xo.addListener(event, listeners[event])
      })
    }
  }

  _removeListeners() {
    const listeners = this._listeners
    Object.keys(listeners).forEach(event => {
      this._xo.removeListener(event, listeners[event])
    })
  }

  async _handleEvent(event, { userId, userIp, userName, ...data }) {
    try {
      if (event !== 'apiCall' || !this._blockedList[data.method]) {
        return await this._auditCore.add(
          {
            userId,
            userIp,
            userName,
          },
          event,
          data
        )
      }
    } catch (error) {
      log.error(error)
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
            'content-type': 'application/x-gzip',
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
            .replace(/:/g, '_')}.ndjson.gz`,
        }
      )
      .then($getFrom => ({
        $getFrom,
      }))
  }

  // See www-xo#344
  async _uploadLastHash() {
    const xo = this._xo
    const chain = await xo.audit.getLastChain()

    let lastHash, integrityCheckSuccess
    if (chain !== null) {
      const hashes = chain.hashes
      lastHash = hashes[hashes.length - 1]

      // check the integrity of all stored hashes
      integrityCheckSuccess = await Promise.all(
        hashes.map((oldest, key) =>
          oldest !== lastHash
            ? this._checkIntegrity({ oldest, newest: hashes[key + 1] })
            : true
        )
      ).then(
        () => true,
        () => false
      )
    }

    // generate a valid fingerprint of all stored records in case of a failure integrity check
    const { oldest, newest, error } = await this._generateFingerprint({
      oldest: integrityCheckSuccess ? lastHash : undefined,
    })

    if (chain === null || !integrityCheckSuccess || error !== undefined) {
      await xo.audit.startNewChain({ oldest, newest })
    } else {
      await xo.audit.extendLastChain({ oldest, newest })
    }
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
        newest,
        nValid: await this._checkIntegrity({ oldest, newest }),
        oldest,
      }
    } catch (error) {
      if (missingAuditRecord.is(error) || alteredAuditRecord.is(error)) {
        return {
          error,
          fingerprint: `${error.data.id}|${newest}`,
          newest,
          nValid: error.data.nValid,
          oldest: error.data.id,
        }
      }
      throw error
    }
  }
}

AuditXoPlugin.prototype._getRecordsStream = asyncIteratorToStream(
  async function* (id) {
    for await (const record of this._auditCore.getFrom(id)) {
      yield JSON.stringify(record)
      yield '\n'
    }
  }
)

export default opts => new AuditXoPlugin(opts)
