import asyncMapSettled from '@xen-orchestra/async-map'
import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'

import { forkStreamUnpipe } from './_forkStreamUnpipe'
import { Task } from './_Task'

const DIR_XO_POOL_METADATA_BACKUPS = 'xo-pool-metadata-backups'
const PATH_DB_DUMP = '/pool/xmldbdump'

export class PoolMetadataBackup {
  constructor({ config, job, pool, remoteAdapters, schedule, settings }) {
    this.config = config
    this.job = job
    this.pool = pool
    this.remoteAdapters = remoteAdapters
    this.schedule = schedule
    this.settings = settings
  }

  _exportPoolMetadata() {
    const xapi = this.pool.$xapi
    return xapi.getResource(PATH_DB_DUMP, {
      task: xapi.createTask('Export pool metadata'),
    })
  }

  async run() {
    const timestamp = Date.now()

    const { job, schedule, pool } = this
    const poolDir = `${DIR_XO_POOL_METADATA_BACKUPS}/${schedule.id}/${pool.$id}`
    const dir = `${poolDir}/${formatFilenameDate(timestamp)}`

    const stream = forkStreamUnpipe(await this._exportPoolMetadata())
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

    await asyncMapSettled(
      this.remoteAdapters,
      async (adapter, remoteId) =>
        Task.run(
          {
            name: `Starting metadata backup for the pool (${pool.$id}) for the remote (${remoteId}). (${job.id})`,
            data: {
              id: remoteId,
              type: 'remote',
            },
          },
          async () => {
            await adapter.outputStream(stream, fileName, { checksum: false })
            await adapter.handler.outputFile(metaDataFileName, metadata, {
              dirMode: this.config.dirMode,
            })
            await adapter.deleteOldMetadataBackups(poolDir, this.settings.retentionPoolMetadata)
          }
        ).catch(() => {}) // errors are handled by logs
    )
  }
}
