import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { fetchGet } from '@/shared/utils/fetch.util.ts'

// Mounts the BR once so the server records its current status (error or not)
// A failure here must not fail the caller: the BR exists and its error is stored on it
export function checkBackupRepositoryHealth(id: FrontXoBackupRepository['id']): Promise<void> {
  return fetchGet<void>(`backup-repositories/${id}/health`).catch(() => {})
}
