'use strict'

const { asyncMap } = require('@xen-orchestra/async-map')

const { DIR_XO_CONFIG_BACKUPS } = require('./RemoteAdapter.js')
const { formatFilenameDate } = require('./_filenameDate.js')
const { Task } = require('./Task.js')

exports.XoMetadataBackup = class XoMetadataBackup {
  constructor({ config, job, remoteAdapters, schedule, settings }) {
    this._config = config
    this._job = job
    this._remoteAdapters = remoteAdapters
    this._schedule = schedule
    this._settings = settings
  }

  async run() {
    const timestamp = Date.now()

    const { _job: job, _schedule: schedule } = this
    const scheduleDir = `${DIR_XO_CONFIG_BACKUPS}/${schedule.id}`
    const dir = `${scheduleDir}/${formatFilenameDate(timestamp)}`

    const data = job.xoMetadata
    const fileName = `${dir}/data.json`

    const metadata = JSON.stringify(
      {
        jobId: job.id,
        jobName: job.name,
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
            name: `Starting XO metadata backup for the remote (${remoteId}). (${job.id})`,
            data: {
              id: remoteId,
              type: 'remote',
            },
          },
          async () => {
            const handler = adapter.handler
            const dirMode = this._config.dirMode
            await handler.outputFile(fileName, data, { dirMode })
            await handler.outputFile(metaDataFileName, metadata, {
              dirMode,
            })
            await adapter.deleteOldMetadataBackups(scheduleDir, this._settings.retentionXoMetadata)
          }
        ).catch(() => {}) // errors are handled by logs
    )
  }
}
