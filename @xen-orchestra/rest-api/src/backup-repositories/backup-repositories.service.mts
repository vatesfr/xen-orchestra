import { IdOr, XoBackupRepository } from '@vates/types'

export class BackupRepositoriesService {
  public isRepositoryInRemotes(
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
}
