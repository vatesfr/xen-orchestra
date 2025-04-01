import * as CM from 'complex-matcher'
import asyncIteratorToStream from 'async-iterator-to-stream'
import ndjson from 'ndjson'
import { alteredAuditRecord, missingAuditRecord } from 'xo-common/api-errors'
import { createGzip, createUnzip } from 'zlib'
import { createLogger } from '@xen-orchestra/log'
import { createSchedule } from '@xen-orchestra/cron'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { fromCallback } from 'promise-toolbox'
import { AlteredRecordError, AuditCore, MissingRecordError, NULL_ID, Storage } from '@xen-orchestra/audit-core'
import { PassThrough, pipeline, promises } from 'readable-stream'

const log = createLogger('xo:xo-server-audit')

const DEFAULT_BLOCKED_LIST = {
  'acl.get': true,
  'acl.getCurrentPermissions': true,
  'api.getConnections': true,
  'audit.checkIntegrity': true,
  'audit.clean': true,
  'audit.deleteRange': true,
  'audit.generateFingerprint': true,
  'audit.getRecords': true,
  'backup.list': true,
  'backupNg.getAllJobs': true,
  'backupNg.getAllLogs': true,
  'backupNg.getJob': true,
  'backupNg.getLogs': true,
  'backupNg.getSuggestedExcludedTags': true,
  'backupNg.listVmBackups': true,
  'cloud.getResourceCatalog': true,
  'cloudConfig.getAll': true,
  'cloudConfig.getAllNetworkConfigs': true,
  'group.getAll': true,
  'host.getBiosInfo': true,
  'host.getIpmiSensors': true,
  'host.getMdadmHealth': true,
  'host.getSchedulerGranularity': true,
  'host.getSmartctlHealth': true,
  'host.isHostServerTimeConsistent': true,
  'host.isHyperThreadingEnabled': true,
  'host.isPubKeyTooShort': true,
  'host.stats': true,
  'ipPool.getAll': true,
  'job.get': true,
  'job.getAll': true,
  'log.get': true,
  'metadataBackup.getAllJobs': true,
  'metadataBackup.getJob': true,
  'mirrorBackup.getAllJobs': true,
  'mirrorBackup.getJob': true,
  'netdata.getHostApiKey': true,
  'netdata.getLocalApiKey': true,
  'netdata.isNetDataInstalledOnHost': true,
  'network.getBondModes': true,
  'pci.getDom0AccessStatus': true,
  'pif.getIpv4ConfigurationModes': true,
  'pif.getIpv6ConfigurationModes': true,
  'plugin.get': true,
  'pool.getGuestSecureBootReadiness': true,
  'pool.getLicenseState': true,
  'pool.getPatchesDifference': true,
  'pool.listMissingPatches': true,
  'proxy.get': true,
  'proxy.getAll': true,
  'proxy.getApplianceUpdaterState': true,
  'remote.get': true,
  'remote.getAll': true,
  'remote.getAllInfo': true,
  'remote.list': true,
  'resourceSet.get': true,
  'resourceSet.getAll': true,
  'role.getAll': true,
  'schedule.get': true,
  'schedule.getAll': true,
  'server.getAll': true,
  'session.getUser': true,
  'session.signIn': true,
  'sr.getAllUnhealthyVdiChainsLength': true,
  'sr.getVdiChainsInfo': true,
  'sr.stats': true,
  'system.getMethodsInfo': true,
  'system.getServerTimezone': true,
  'system.getServerVersion': true,
  'system.getVersion': true,
  'tag.getAllConfigured': true,
  'test.getPermissionsForUser': true,
  'user.getAll': true,
  'user.getAuthenticationTokens': true,
  'vif.getLockingModeValues': true,
  'vm.getCloudInitConfig': true,
  'vm.getHaValues': true,
  'vm.getSecurebootReadiness': true,
  'vm.stats': true,
  'xo.getAllObjects': true,
  'xoa.check': true,
  'xoa.clearCheckCache': true,
  'xoa.getApplianceInfo': true,
  'xoa.getHVSupportedVersions': true,
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

  async clean() {
    const db = this._db

    // delete first so that a new chain can be constructed even if anything else fails
    await db.del(LAST_ID)

    return new Promise((resolve, reject) => {
      let count = 1
      const cb = () => {
        if (--count === 0) {
          resolve()
        }
      }
      const deleteEntry = key => {
        ++count
        db.del(key, cb)
      }
      db.createKeyStream().on('data', deleteEntry).on('end', cb).on('error', reject)
    })
  }

  async isEmpty() {
    const readStream = this._db.createReadStream({ limit: 1 })
    return new Promise(function (resolve, reject) {
      readStream
        .on('data', () => resolve(false))
        .on('end', () => resolve(true))
        .on('error', reject)
    })
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

    const { enabled = true, schedule: { cron = '0 6 * * *', timezone } = {} } = staticConfig.lastHashUpload ?? {}

    if (enabled) {
      this._uploadLastHashJob = createSchedule(cron, timezone).createJob(() => this._uploadLastHash().catch(log.error))
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

    const importRecords = this._importRecords.bind(this)
    importRecords.description = 'Import audit logs from a file'
    importRecords.permission = 'admin'

    const getRecords = this._getRecords.bind(this)
    getRecords.description = 'Get records from a passed record ID'
    getRecords.permission = 'admin'
    getRecords.params = {
      id: { type: 'string', optional: true },

      // null is used to bypass the default limit
      maxRecords: { type: ['number', 'null'], optional: true },

      ndjson: { type: 'boolean', optional: true },
    }

    const checkIntegrity = this._checkIntegrity.bind(this)
    checkIntegrity.description = 'Check records integrity between oldest and newest'
    checkIntegrity.permission = 'admin'
    checkIntegrity.params = {
      newest: { type: 'string', optional: true },
      oldest: { type: 'string', optional: true },
    }

    const generateFingerprint = this._generateFingerprint.bind(this)
    generateFingerprint.description = 'Generate a fingerprint of the chain oldest-newest'
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

    const clean = this._storage.clean.bind(this._storage)
    clean.permission = 'admin'
    clean.description = 'Clean audit database'

    const deleteRange = this._deleteRangeAndRewrite.bind(this)
    deleteRange.description = 'Delete a range of records and rewrite the records chain'
    deleteRange.permission = 'admin'
    deleteRange.params = {
      newest: { type: 'string' },
      oldest: { type: 'string', optional: true },
    }

    cleaners.push(
      this._xo.addApiMethods({
        audit: {
          checkIntegrity,
          clean,
          deleteRange,
          exportRecords,
          generateFingerprint,
          getRecords,
          importRecords,
        },
      })
    )

    cleaners.push(
      this._xo.registerRestApi(
        {
          records: {
            ':id': {
              _get: async (req, _, next) => {
                const record = await this._auditCore.get(req.params.id)
                if (record !== undefined) {
                  return record
                }
                next()
              },
            },

            _get: async function* ({ query }) {
              const limit = query.limit === undefined ? Infinity : +query.limit
              const filter = query.filter === undefined ? () => true : CM.parse(query.filter).createPredicate()

              let i = 0
              for await (const record of this._auditCore.getFrom(query.from)) {
                if (++i > limit) {
                  break
                }

                if (filter(record)) {
                  yield record
                }
              }
            }.bind(this),
          },
        },
        '/plugins/audit'
      )
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

  async _getRecords({ id, maxRecords = 10e3, ndjson = false }) {
    if (ndjson) {
      return this._xo
        .registerHttpRequest((req, res) => {
          res.set('Content-Type', 'application/json')
          return fromCallback(pipeline, this._getRecordsStream(id, maxRecords === null ? undefined : maxRecords), res)
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
          return fromCallback(pipeline, this._getRecordsStream(), createGzip(), res)
        },
        undefined,
        {
          suffix: `/audit-records-${new Date().toISOString().replace(/:/g, '_')}.ndjson.gz`,
        }
      )
      .then($getFrom => ({
        $getFrom,
      }))
  }

  async _handleImportRecords($defer, { fileStream, zipped }) {
    $defer(await this._storage.acquireLock())

    await this._storage.clean()
    if (!(await this._storage.isEmpty())) {
      throw new Error('Unable to clean audit log database')
    }

    const processRecord = async source => {
      let lastId
      for await (const chunk of source) {
        const id = await this._auditCore._importRecord(chunk)
        // entries are listed from newest to oldest, so first entry is the last
        if (lastId === undefined) {
          lastId = id
          await this._storage.setLastId(lastId)
        }
      }
    }

    try {
      await promises.pipeline(fileStream, zipped ? createUnzip() : new PassThrough(), ndjson.parse(), processRecord)
    } catch (err) {
      // Cleaning database because we only partially imported the logs
      await this._storage.clean()
      throw err
    }

    // TODO: maybe find a way to add back the "audit.importRecords" record

    if (this._uploadLastHashJob !== undefined) {
      await this._uploadLastHash()
    }
  }

  async _importRecords({ zipped }) {
    // TODO: maybe check that the current www-xo audit chain is === null to make sure we not erasing important logs? this._xo.audit.getLastChain()
    if (!(await this._storage.isEmpty())) {
      throw new Error('Database must be empty')
    }

    return {
      $sendTo: await this._xo.registerHttpRequest(async (req, res) => {
        await this._handleImportRecords({ fileStream: req, zipped })

        res.end('audit logs successfully imported')
      }),
    }
  }

  // See www-xo#344
  async _uploadLastHash() {
    const xo = this._xo

    // In case of non-existent XOA plugin
    if (xo.audit === undefined) {
      return
    }

    const lastRecordId = await this._storage.getLastId()
    if (lastRecordId === undefined) {
      return
    }

    const chain = await xo.audit.getLastChain()

    let lastValidHash
    if (chain !== null) {
      const hashes = chain.hashes
      lastValidHash = hashes[hashes.length - 1]

      if (lastValidHash === lastRecordId) {
        return
      }

      // check the integrity of all stored hashes
      try {
        for (let i = 0; i < hashes.length - 1; ++i) {
          await this._checkIntegrity({
            oldest: hashes[i],
            newest: hashes[i + 1],
          })
        }
      } catch (error) {
        if (!missingAuditRecord.is(error) && !alteredAuditRecord.is(error)) {
          throw error
        }

        lastValidHash = undefined
      }
    }

    // generate a valid fingerprint of all stored records in case of a failure integrity check
    const { oldest, newest, error } = await this._generateFingerprint({
      oldest: lastValidHash,
    })

    if (lastValidHash === undefined || error !== undefined) {
      await xo.audit.startNewChain({ oldest, newest })
    } else {
      await xo.audit.extendLastChain({ oldest, newest })
    }
  }

  async _checkIntegrity(props) {
    const { oldest = NULL_ID, newest = await this._storage.getLastId() } = props
    return this._auditCore.checkIntegrity(oldest, newest).catch(error => {
      if (error instanceof MissingRecordError) {
        log.warn(`Missing record ${error.id} in audit log chain`)
        throw missingAuditRecord(error)
      }
      if (error instanceof AlteredRecordError) {
        log.warn(`Altered record ${error.id} in audit log chain`)
        throw alteredAuditRecord(error)
      }
      throw error
    })
  }

  async _generateFingerprint(props) {
    const { oldest = NULL_ID, newest = (await this._storage.getLastId()) ?? NULL_ID } = props
    try {
      return {
        fingerprint: `${oldest}|${newest}`,
        newest,
        nValid: newest !== NULL_ID ? await this._checkIntegrity({ oldest, newest }) : 0,
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

  async _deleteRangeAndRewrite({ newest, oldest = newest }) {
    await this._auditCore.deleteRangeAndRewrite(newest, oldest)
    if (this._uploadLastHashJob !== undefined) {
      await this._uploadLastHash()
    }
  }
}

AuditXoPlugin.prototype._getRecordsStream = asyncIteratorToStream(async function* (id, maxRecords = Infinity) {
  for await (const record of this._auditCore.getFrom(id)) {
    if (--maxRecords < 0) {
      break
    }

    yield JSON.stringify(record)
    yield '\n'
  }
})

decorateClass(AuditXoPlugin, {
  _handleImportRecords: defer,
})

export default opts => new AuditXoPlugin(opts)
