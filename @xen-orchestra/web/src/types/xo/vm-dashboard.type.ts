import type { Status } from '@core/components/status/VtsStatus.vue'
import type { XoVmBackupArchive, XoVm, XoUser, XoHost, XoAlarm, XoSr, XoVmBackupJob } from '@vates/types'

export type VmDashboardRun = { backupJobId: XoVmBackupJob['id']; timestamp: number; status: Status }
export type VmDashboardBackupArchive = {
  id: XoVmBackupArchive['id']
  timestamp: XoVmBackupArchive['timestamp']
  backupRepository: XoVmBackupArchive['backupRepository']
  size: XoVmBackupArchive['size']
}

export type XoVmDashboard = {
  quickInfo: Pick<
    XoVm,
    | 'id'
    | 'power_state'
    | 'uuid'
    | 'name_description'
    | 'mainIpAddress'
    | '$pool'
    | 'virtualizationMode'
    | 'tags'
    | 'startTime'
    | 'pvDriversVersion'
    | 'pvDriversUpToDate'
  > & {
    CPUs: {
      number: number
    }
    os_version: {
      name?: string
    }
    memory: {
      size: number
    }
    creation: {
      date?: string
      user?: XoUser['id']
    }
    host?: XoHost['id']
    pvDriversDetected: boolean
  }
  alarms: XoAlarm['id'][]
  backupsInfo: {
    lastRuns: VmDashboardRun[]
    vmProtection: 'protected' | 'unprotected' | 'not-in-job'
    replication?: { id: XoVm['id']; timestamp: number; sr?: XoSr['id'] }
    backupArchives: VmDashboardBackupArchive[]
  }
}
