import type { XoProxy } from '@/types/xo/proxy.type.ts'
import type { Branded } from '@core/types/utility.type'
import type { XoBackupRepository, XoPool, XoSchedule, XoSr } from '@vates/types'

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
  compression?: 'native' | 'zstd' | ''
  settings: {
    '': {
      cbtDestroySnapshotData?: boolean
      concurrency?: number
      longTermRetention?: {
        daily?: { retention: number; settings: Record<string, unknown> }
        weekly?: { retention: number; settings: Record<string, unknown> }
        monthly?: { retention: number; settings: Record<string, unknown> }
        yearly?: { retention: number; settings: Record<string, unknown> }
      }
      maxExportRate?: number
      nbdConcurrency?: number
      nRetriesVmBackupFailures?: number
      preferNbd?: boolean
      timezone?: string
      [key: string]: unknown
    }
    [key: XoSchedule['id']]: {
      exportRetention?: number
      healthCheckSr?: XoSr['id']
      healthCheckVmsWithTags?: string[]
      fullInterval?: number
      copyRetention?: number
      snapshotRetention?: number
      cbtDestroySnapshotData?: boolean
      [key: string]: unknown
    }
  }
  proxy?: XoProxy['id']
}
