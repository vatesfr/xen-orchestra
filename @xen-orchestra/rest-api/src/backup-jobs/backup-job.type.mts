import type {
  XoVmBackupJob,
  XoVmBackupJobGeneralSettings,
  XoMetadataBackupJob,
  XoMirrorBackupJob,
  XoMetadataBackupJobGeneralSettings,
  XoMetadataBackupJobScheduleSettings,
  XoMirrorBackupGeneralSettings,
} from '@vates/types'
import { Unbrand } from '../open-api/common/response.common.mjs'
import type * as CMType from '@vates/types/lib/complex-matcher'

// Manual copy because with Unbrand<>, tsoa emits an empty schema. If XoVmBackupJobScheduleSettings changes
// in @vates/types, you have to update this copy too.
type UnbrandedXoVmBackupJobScheduleSettings = {
  exportRetention?: number
  healthCheckVmsWithTags?: string[] | string
  fullInterval?: number | string
  copyRetention?: number
  snapshotRetention?: number
  cbtDestroySnapshotData?: boolean
  healthCheckSr?: string
  [key: string]: unknown
}

type UnbrandedXoVmBackupJob = Omit<XoVmBackupJob, 'settings' | 'remotes' | 'vms' | 'srs'> & {
  remotes?: CMType.IdOr<string> | string
  vms: CMType.IdOr<string> | Record<string, unknown>
  srs?: CMType.IdOr<string> | string
  settings: {
    '': XoVmBackupJobGeneralSettings
    [scheduleId: string]: UnbrandedXoVmBackupJobScheduleSettings | undefined
  }
}
export type UnbrandXoVmBackupJob = Unbrand<UnbrandedXoVmBackupJob>

type UnbrandedXoMetadataBackupJob = Omit<XoMetadataBackupJob, 'settings' | 'pools' | 'remotes'> & {
  pools?: CMType.IdOr<string>
  remotes: CMType.IdOr<string>
  settings: {
    ''?: XoMetadataBackupJobGeneralSettings
    [scheduleId: string]: XoMetadataBackupJobScheduleSettings | undefined
  }
}
export type UnbrandXoMetadataBackupJob = Unbrand<UnbrandedXoMetadataBackupJob>

// Manual copy because with Unbrand<>, tsoa emits an empty schema. If XoMirrorBackupScheduleSettings changes
// in @vates/types, you have to update this copy too.
type UnbrandedXoMirrorBackupScheduleSettings = {
  exportRetention?: number
  healthCheckVmsWithTags?: string[] | string
  vmFilter?: string
  healthCheckSr?: string
  [key: string]: unknown
}

type UnbrandedXoMirrorBackupJob = Omit<XoMirrorBackupJob, 'settings' | 'remotes'> & {
  remotes: CMType.IdOr<string>
  settings: {
    '': XoMirrorBackupGeneralSettings
    [scheduleId: string]: UnbrandedXoMirrorBackupScheduleSettings | undefined
  }
}
export type UnbrandXoMirrorBackupJob = Unbrand<UnbrandedXoMirrorBackupJob>

export type UnbrandAnyXoBackupJob = UnbrandXoVmBackupJob | UnbrandXoMetadataBackupJob | UnbrandXoMirrorBackupJob

export type CreateBackupJobSchedule = {
  cron: string
  enabled?: boolean
  name?: string
  timezone?: string
}

type WithSchedules = {
  /**
   * Schedules to create along the job, keyed by temporary IDs.
   *
   * These temporary IDs can be used as keys in `settings`, they will be replaced by the IDs of the created schedules.
   */
  schedules?: Record<string, CreateBackupJobSchedule>
}

export type CreateVmBackupJobBody = Omit<UnbrandXoVmBackupJob, 'id'> & WithSchedules
export type CreateMetadataBackupJobBody = Omit<UnbrandXoMetadataBackupJob, 'id' | 'userId'> & WithSchedules
export type CreateMirrorBackupJobBody = Omit<UnbrandXoMirrorBackupJob, 'id'> & WithSchedules
export type CreateBackupJobBody = CreateVmBackupJobBody | CreateMetadataBackupJobBody | CreateMirrorBackupJobBody

export type UpdateVmBackupJobBody = Partial<Omit<UnbrandXoVmBackupJob, 'id' | 'type'>>
export type UpdateMetadataBackupJobBody = Partial<Omit<UnbrandXoMetadataBackupJob, 'id' | 'type' | 'userId'>>
export type UpdateMirrorBackupJobBody = Partial<Omit<UnbrandXoMirrorBackupJob, 'id' | 'type'>>
export type UpdateBackupJobBody = UpdateVmBackupJobBody | UpdateMetadataBackupJobBody | UpdateMirrorBackupJobBody
