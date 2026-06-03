import { AnyXoBackupJob, IdOr, XoBackupRepository } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'

export class BackupRepositoryService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }
  public isRepositoryReferenced(
    remotes: AnyXoBackupJob['remotes'],

    repositoryId: XoBackupRepository['id']
  ): boolean {
    if (remotes === undefined) {
      return false
    }
    const { id } = remotes
    const ids = typeof id === 'string' ? [id] : id.__or
    return ids.includes(repositoryId)
  }
  public async getReferencingJobs(repositoryId: XoBackupRepository['id']): Promise<string[]> {
    const allJobs = await this.#restApi.xoApp.getAllJobs()
    const referencingJobs: string[] = []

    for (const job of allJobs) {
      if (job.type === 'backup' || job.type === 'metadataBackup') {
        if (this.isRepositoryReferenced(job.remotes, repositoryId)) {
          referencingJobs.push(job.id)
        }
      } else if (job.type === 'mirrorBackup') {
        if (job.sourceRemote === repositoryId || this.isRepositoryReferenced(job.remotes, repositoryId)) {
          referencingJobs.push(job.id)
        }
      }
    }

    return referencingJobs
  }
}
