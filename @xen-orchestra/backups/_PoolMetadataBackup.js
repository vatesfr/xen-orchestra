'use strict'

const { asyncMap } = require('@xen-orchestra/async-map')

const { DIR_XO_POOL_METADATA_BACKUPS } = require('./RemoteAdapter.js')
const { forkStreamUnpipe } = require('./_forkStreamUnpipe.js')
const { formatFilenameDate } = require('./_filenameDate.js')
const { Task } = require('./Task.js')

const PATH_DB_DUMP = '/pool/xmldbdump'
exports.PATH_DB_DUMP = PATH_DB_DUMP

exports.PoolMetadataBackup = class PoolMetadataBackup {
  constructor({ config, job, pool, remoteAdapters, schedule, settings }) {
    this._config = config
    this._job = job
    this._pool = pool
    this._remoteAdapters = remoteAdapters
    this._schedule = schedule
    this._settings = settings
  }

  _exportPoolMetadata() {
    const xapi = this._pool.$xapi
    return xapi.getResource(PATH_DB_DUMP, {
      task: xapi.task_create('Export pool metadata'),
    })
  }

  async run() {
    const timestamp = Date.now()

    const { _job: job, _schedule: schedule, _pool: pool } = this
    const poolDir = `${DIR_XO_POOL_METADATA_BACKUPS}/${schedule.id}/${pool.$id}`
    const dir = `${poolDir}/${formatFilenameDate(timestamp)}`

    const stream = await this._exportPoolMetadata()
    const fileName = `${dir}/data`

    const metadata = JSON.stringify(
      {
        jobId: job.id,
        jobName: job.name,
        pool,
        poolMaster: pool.$master,
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        timestamp,
      },
      null,
      2
    )
    const metaDataFileName = `${dir}/metadata.json`

    await asyncMap(
      Object.entries(this._remoteAdapters),
      ([remoteId, adapter]) =>
        Task.run(
          {
            name: `Starting metadata backup for the pool (${pool.$id}) for the remote (${remoteId}). (${job.id})`,
            data: {
              id: remoteId,
              type: 'remote',
            },
          },
          async () => {
            // forkStreamUnpipe should be used in a sync way, do not wait for a promise before using it
            await adapter.outputStream(fileName, forkStreamUnpipe(stream), { checksum: false })
            await adapter.handler.outputFile(metaDataFileName, metadata, {
              dirMode: this._config.dirMode,
            })
            await adapter.deleteOldMetadataBackups(poolDir, this._settings.retentionPoolMetadata)
          }
        ).catch(() => {}) // errors are handled by logs
    )
  }
}
