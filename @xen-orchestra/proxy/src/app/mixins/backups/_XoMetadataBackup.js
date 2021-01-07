import asyncMapSettled from '@xen-orchestra/async-map'
import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'

import { Task } from './_Task'

const DIR_XO_CONFIG_BACKUPS = 'xo-config-backups'

export class XoMetadataBackup {
  constructor({ config, job, remoteAdapters, schedule, settings }) {
    this.config = config
    this.job = job
    this.remoteAdapters = remoteAdapters
    this.schedule = schedule
    this.settings = settings
  }

  async run() {
    const timestamp = Date.now()

    const { job, schedule } = this
    const scheduleDir = `${DIR_XO_CONFIG_BACKUPS}/${schedule.id}`
    const dir = `${scheduleDir}/${formatFilenameDate(timestamp)}`

    const data = JSON.stringify(job.xoMetadata, null, 2)
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

    await asyncMapSettled(
      this.remoteAdapters,
      (adapter, remoteId) =>
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
            const dirMode = this.config.dirMode
            await handler.outputFile(fileName, data, { dirMode })
            await handler.outputFile(metaDataFileName, metadata, {
              dirMode,
            })
            await adapter.deleteOldMetadataBackups(scheduleDir, this.settings.retentionXoMetadata)
          }
        ).catch(() => {}) // errors are handled by logs
    )
  }
}
