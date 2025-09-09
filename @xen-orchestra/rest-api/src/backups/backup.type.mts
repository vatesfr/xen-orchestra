import type { XoBackupJob, XoBackupJobGeneralSettings, XoBackupJobScheduleSettings } from '@vates/types'
import { Unbrand } from '../open-api/common/response.common.mjs'

type UnbrandedXoBackupJob = Unbrand<XoBackupJob>
export type UnbrandXoBackupJob = Omit<UnbrandedXoBackupJob, 'settings' | 'remotes' | 'vms' | 'srs'> & {
  remotes?: {
    id: string | { __or: string[] }
  }
  vms:
    | {
        id: string | { __or: string[] }
      }
    | Record<string, unknown>
  srs?: {
    id: string | { __or: string[] }
  }
  settings: {
    '': XoBackupJobGeneralSettings
    [scheduleId: string]: Unbrand<XoBackupJobScheduleSettings>
  }
}
