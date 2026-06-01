import { IdOr, XoBackupRepository } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'

export class BackupRepositoriesService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }
  public isRepositoryReferenced(
    remotes: IdOr<XoBackupRepository['id']> | undefined,
    repositoryId: XoBackupRepository['id']
  ): boolean {
    if (remotes === undefined) {
      return false
    }
    const { id } = remotes
    const ids = typeof id === 'string' ? [id] : id.__or
    return ids.includes(repositoryId)
  }
  public async getReferencingJobs(repositoryId: XoBackupRepository['id']): Promise<IdOr<string>[]> {
    const allJobs = await this.#restApi.xoApp.getAllJobs()
    const referencingJobs = allJobs.filter(job => {
      if (job.type === 'backup' || job.type === 'metadataBackup') {
        return this.isRepositoryReferenced(job.remotes, repositoryId)
      } else if (job.type === 'mirrorBackup') {
        return job.sourceRemote === repositoryId || this.isRepositoryReferenced(job.remotes, repositoryId)
      }
      return false
    })
    return referencingJobs.map(job => ({ id: job.id }))
  }
}
