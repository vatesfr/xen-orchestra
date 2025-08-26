import type { Branded } from '@core/types/utility.type'
import type { XoBackupRepository, XoPool } from '@vates/types'

export type XoMetadataBackupJob = {
  id: Branded<'metadata-backup-job'>
  type: 'metadataBackup'
  name: string
  xoMetadata?: boolean
  pools?: {
    id: XoPool['id'] | { __or: XoPool['id'][] }
  }
  remotes: {
    id: XoBackupRepository['id'] | { __or: XoBackupRepository['id'][] }
  }
}
