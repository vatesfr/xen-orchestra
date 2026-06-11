import { AnyXoBackupJob, XoBackupRepository } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'

export class BackupRepositoryService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
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
}
