import type { AnyXoBackupJob, XoBackupRepository, AnyXoJob, XoVm } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'
import { inject } from 'inversify'
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

    // checks if a backup job related to this backup repository is running
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

  async reclaimSpace(
    backupRepositoryId: XoBackupRepository['id'],
    vmUuid?: string,
    mergeParam?: boolean,
    remove?: boolean
  ) {
    try {
      const vmuuid = vmUuid as XoVm['id']
      return await this.#restApi.xoApp.reclaimSpace(backupRepositoryId, {
        vmUuid: vmuuid,
        merge: mergeParam,
        remove: remove,
      })
    } catch (error: any) {
      // mixin throws incorrectState (xo-common api-error) when a referencing
      // job is running — surface that as a 409, everything else as 502
      console.log(error?.message)
      if (error?.code === 25 || error?.message === 'incorrect state') {
        throw new ApiError('cannot reclaim space while a backup job is running', 409)
      }
      throw new ApiError('Backup repository unreachable', 502, { data: { cause: String(error) } })
    }
  }
}
