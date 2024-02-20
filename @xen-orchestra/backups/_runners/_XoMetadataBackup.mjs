import { asyncMap } from '@xen-orchestra/async-map'
import { join } from '@xen-orchestra/fs/path'
import { Task } from '@vates/task'

import { DIR_XO_CONFIG_BACKUPS } from '../RemoteAdapter.mjs'
import { formatFilenameDate } from '../_filenameDate.mjs'

export class XoMetadataBackup {
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
    let dataBaseName = './data'

    // JSON data is sent as plain string, binary data is sent as an object with `data` and `encoding properties
    const isJson = typeof data === 'string'
    if (isJson) {
      dataBaseName += '.json'
    }

    const metadata = JSON.stringify(
      {
        data: dataBaseName,
        jobId: job.id,
        jobName: job.name,
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        timestamp,
      },
      null,
      2
    )

    const dataFileName = join(dir, dataBaseName)
    const metaDataFileName = `${dir}/metadata.json`

    await asyncMap(
      Object.entries(this._remoteAdapters),
      ([remoteId, adapter]) =>
        Task.run(
          {
            properties: {
              name: `Starting XO metadata backup for the remote (${remoteId}). (${job.id})`,
              id: remoteId,
              type: 'remote',
            },
          },
          async () => {
            const handler = adapter.handler
            const dirMode = this._config.dirMode
            await handler.outputFile(dataFileName, isJson ? data : Buffer.from(data.data, data.encoding), { dirMode })
            await handler.outputFile(metaDataFileName, metadata, {
              dirMode,
            })
            await adapter.deleteOldMetadataBackups(scheduleDir, this._settings.retentionXoMetadata)
          }
        ).catch(() => {}) // errors are handled by logs
    )
  }
}
