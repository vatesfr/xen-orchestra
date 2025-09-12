import type {
  XoVmBackupJob,
  XoVmBackupJobGeneralSettings,
  XoVmBackupJobScheduleSettings,
  XoMetadataBackupJob,
  XoMirrorBackupJob,
  XoMetadataBackupJobGeneralSettings,
  XoMetadataBackupJobScheduleSettings,
  XoMirrorBackupGeneralSettings,
  XoMirrorBackupScheduleSettings,
} from '@vates/types'
import { Unbrand } from '../open-api/common/response.common.mjs'
import type * as CMType from '@vates/types/lib/complex-matcher'

type UnbrandedXoVmBackupJob = Omit<XoVmBackupJob, 'settings' | 'remotes' | 'vms' | 'srs'> & {
  remotes?: CMType.IdOr<string>
  vms: CMType.IdOr<string> | Record<string, unknown>
  srs?: CMType.IdOr<string>
  settings: {
    '': XoVmBackupJobGeneralSettings
    [scheduleId: string]: Unbrand<XoVmBackupJobScheduleSettings> | undefined
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

type UnbrandedXoMirrorBackupJob = Omit<XoMirrorBackupJob, 'settings' | 'remotes'> & {
  remotes: CMType.IdOr<string>
  settings: {
    '': XoMirrorBackupGeneralSettings
    [scheduleId: string]: Unbrand<XoMirrorBackupScheduleSettings> | undefined
  }
}
export type UnbrandXoMirrorBackupJob = Unbrand<UnbrandedXoMirrorBackupJob>

export type UnbrandAnyXoBackupJob = UnbrandXoVmBackupJob | UnbrandXoMetadataBackupJob | UnbrandXoMirrorBackupJob
