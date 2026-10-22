import type { AnyXoBackupJob, XoBackupRepository, XoVm, XoApp } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'
import { inject } from 'inversify'
import { compileExpression } from '@xen-orchestra/backups/_expressionPredicate.mjs'
import { buildBackupRepositoryContext, buildRunContext } from '@xen-orchestra/backups/_buildContext.mjs'

export class BackupRepositoryService {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    this.#restApi = restApi
  }

  isBackupRepositoryReferenced(
    idsToCheck: AnyXoBackupJob['remotes'],
    repository: XoBackupRepository,
    timezone?: string
  ): boolean {
    if (idsToCheck === undefined) {
      return false
    }

    if (typeof idsToCheck === 'string') {
      return compileExpression(idsToCheck)(
        buildBackupRepositoryContext(repository, buildRunContext(new Date(), timezone))
      )
    } else {
      const { id } = idsToCheck
      const ids = typeof id === 'string' ? [id] : id.__or
      return ids.includes(repository.id)
    }
  }

  public async getReferencingJobs(repositoryId: XoBackupRepository['id']): Promise<AnyXoBackupJob['id'][]> {
    const allJobs = await this.#restApi.xoApp.getAllJobs()
    const referencingJobs: AnyXoBackupJob['id'][] = []
    const repository = await this.#restApi.xoApp.getRemote(repositoryId)

    // checks if a backup job related to this backup repository is running
    for (const job of allJobs) {
      if (job.type === 'backup') {
        if (this.isBackupRepositoryReferenced(job.remotes, repository, job.settings[''].timezone)) {
          referencingJobs.push(job.id)
        }
      } else if (job.type === 'metadataBackup') {
        if (this.isBackupRepositoryReferenced(job.remotes, repository)) {
          referencingJobs.push(job.id)
        }
      } else if (job.type === 'mirrorBackup') {
        if (job.sourceRemote === repositoryId || this.isBackupRepositoryReferenced(job.remotes, repository)) {
          referencingJobs.push(job.id)
        }
      }
    }

    return referencingJobs
  }

  async reclaimSpace(
    backupRepositoryId: XoBackupRepository['id'],
    body?: {
      vmUuid?: string
      merge?: boolean
      remove?: boolean
    }
  ): Promise<Awaited<ReturnType<XoApp['reclaimSpace']>>> {
    const vmUuid = body?.vmUuid as XoVm['id']
    return await this.#restApi.xoApp.reclaimSpace(backupRepositoryId, {
      vmUuid: vmUuid,
      merge: body?.merge,
      remove: body?.remove,
    })
  }
}
