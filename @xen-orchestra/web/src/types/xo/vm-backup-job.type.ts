import type { XoProxy } from '@/types/xo/proxy.type.ts'
import type { XoSr } from '@/types/xo/sr.type.ts'
import type { VM_POWER_STATE, XoVm } from '@/types/xo/vm.type.ts'
import type { Branded } from '@core/types/utility.type'
import { type XoBackupRepository, type XoSchedule } from '@vates/types'

export type VmsSmartModeDisabled = {
  id:
    | XoVm['id']
    | {
        __or: XoVm['id'][]
      }
    | Record<string, unknown>
}

export type VmsSmartModeEnabled = {
  $pool?: Record<string, unknown>
  power_state?: VM_POWER_STATE
  tags?: Record<string, unknown>
  type: 'VM'
}

export type XoVmBackupJob = {
  id: Branded<'vm-backup-job'>
  type: 'backup'
  name: string
  mode: 'full' | 'delta'
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
      timeout?: number
      hideSuccessfulItems?: boolean
      backupReportTpl?: string
      reportWhen?: 'error' | 'failure' | 'always' | 'never'
      checkpointSnapshot?: boolean
      offlineBackup?: boolean
      offlineSnapshot?: boolean
      mergeBackupsSynchronously?: boolean
      reportRecipients?: string[]
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
  srs?: {
    id: XoSr['id'] | { __or: XoSr['id'][] }
  }
  vms?: VmsSmartModeDisabled | VmsSmartModeEnabled
  proxy?: XoProxy['id']
}
