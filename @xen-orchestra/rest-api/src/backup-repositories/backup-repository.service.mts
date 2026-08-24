import type { AnyXoBackupJob, XoBackupRepository, AnyXoJob } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'
import { provide } from 'inversify-binding-decorators'
import { inject } from 'inversify'
import { RemoteAdapter } from '@xen-orchestra/backups/RemoteAdapter.mjs'
import { BACKUP_DIR } from '@xen-orchestra/backups/_getVmBackupDir.mjs'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { Disposable } from 'promise-toolbox'
import { Task } from '@vates/task'
import { asyncEach } from '@vates/async-each'
import { ApiError } from '../helpers/error.helper.mjs'

export interface ReclaimSpaceResult {
  vmUuid: string
  success: boolean
  merge?: boolean
  size?: number
  error?: string
}
type JobWithRunId = AnyXoJob & {
  runId?: string
}

export class BackupRepositoryService {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    this.#restApi = restApi
  }
  isBackupRepositoryReferenced(
    idsToCheck: AnyXoBackupJob['remotes'],

    repositoryId: XoBackupRepository['id']
  ): boolean {
    if (idsToCheck === undefined) {
      return false
    }
    const { id } = idsToCheck
    const ids = typeof id === 'string' ? [id] : id.__or
    return ids.includes(repositoryId)
  }
  public async getReferencingJobs(repositoryId: XoBackupRepository['id']): Promise<AnyXoBackupJob['id'][]> {
    const allJobs = await this.#restApi.xoApp.getAllJobs()
    const referencingJobs: AnyXoBackupJob['id'][] = []

    for (const job of allJobs) {
      if (job.type === 'backup' || job.type === 'metadataBackup') {
        if (this.isBackupRepositoryReferenced(job.remotes, repositoryId)) {
          referencingJobs.push(job.id)
        }
      } else if (job.type === 'mirrorBackup') {
        if (job.sourceRemote === repositoryId || this.isBackupRepositoryReferenced(job.remotes, repositoryId)) {
          referencingJobs.push(job.id)
        }
      }
    }

    return referencingJobs
  }

  async reclaimSpace(backupRepositoryId: XoBackupRepository['id'], vmUuid?: string) {
    const referencingJobs = await this.getReferencingJobs(backupRepositoryId)
    const jobs = await this.#restApi.xoApp.getAllJobs()
    const runningJobs = jobs.filter(
      job => (job as JobWithRunId).runId !== undefined && referencingJobs.includes(job.id)
    )

    if (Object.keys(runningJobs).length > 0) {
      throw new ApiError('cannot reclaim space while a backup job is running', 409)
    }
    const remote = await this.#restApi.xoApp.getRemote(backupRepositoryId)

    let results: ReclaimSpaceResult[]
    try {
      results = await Disposable.use(getSyncedHandler(remote), async handler => {
        const adapter = new RemoteAdapter(handler)
        const vmUuids: string[] = vmUuid !== undefined ? [vmUuid] : await adapter.listAllVms()

        Task.set('total', vmUuids.length)
        let done = 0

        const results: ReclaimSpaceResult[] = []

        await asyncEach(
          vmUuids,
          async uuid => {
            try {
              await Task.run({ name: `Clean VM ${uuid}`, data: { type: 'VM', id: uuid } }, () =>
                adapter.cleanVm(`${BACKUP_DIR}/${uuid}`, {
                  lock: true,
                  remove: true,
                  merge: true,
                  logInfo: Task.info,
                  logWarn: Task.warning,
                })
              )

              results.push({
                vmUuid: uuid,
                success: true,
              })
            } catch (error: any) {
              throw new ApiError(`failed to reclaim space for VM ${uuid}, error: ${error.message}`, 400)
            } finally {
              done++
              Task.set('progress', Math.round((done / vmUuids.length) * 100))
            }
          },
          { concurrency: 2 }
        )
        return results
      })
    } catch (error) {
      throw new ApiError(`${error}`, 502)
    }

    const failures = results.filter(r => !r.success)
    if (failures.length === results.length && results.length > 0) {
      throw new ApiError('Reclaim space failed for all VMs', 400, { data: { results } })
    }

    return results
  }
}
