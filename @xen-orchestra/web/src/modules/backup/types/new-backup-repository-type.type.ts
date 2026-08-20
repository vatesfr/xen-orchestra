import type { BackupRepositoryInfoInput } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'

export type BackupRepositoryDetailsPayload = {
  urlInfo: BackupRepositoryInfoInput
  options?: string
}
