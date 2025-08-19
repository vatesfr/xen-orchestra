import type { XoVm } from '@/types/xo/vm.type.ts'
import type { Branded } from '@core/types/utility.type'
import { type XoBackupRepository, type XoSchedule, type XoSr } from '@vates/types'

export type XoVmBackup = {
  id: Branded<'backup-job'>
  type: 'backup'
  name: string
  mode: 'full' | 'delta'
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
  remotes?: {
    id: XoBackupRepository['id'] | { __or: XoBackupRepository['id'][] }
  }
  srs: {
    id: XoSr['id'] | { __or: XoSr['id'][] }
  }
  vms?: {
    id: XoVm['id'] | { __or: XoVm['id'][] } | Record<string, unknown>
  }
}
