import type { XoAlarm, XoHost, XoSr, XoUser, XoVm, XoVmBackupArchive, XoVmBackupJob } from '@vates/types'
import { Unbrand } from '../open-api/common/response.common.mjs'

type VmDashboardRun = { backupJobId: XoVmBackupJob['id']; timestamp: number; status: string }
type VmDashboardBackupArchive = {
  id: XoVmBackupArchive['id']
  timestamp: XoVmBackupArchive['timestamp']
  backupRepository: XoVmBackupArchive['backupRepository']
  size: XoVmBackupArchive['size']
}

export type VmDashboard = {
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
    vmProtection: 'protected' | 'unprotected' | 'not-in-active-job'
    replication: { id: XoVm['id']; timestamp: number; sr?: XoSr['id'] } | {}
    backupArchives: VmDashboardBackupArchive[]
  }
}

export type UnbrandedVmDashboard = {
  quickInfo: Omit<Unbrand<VmDashboard['quickInfo']>, 'creation'> & {
    creation: Unbrand<VmDashboard['quickInfo']['creation']>
  }
  alarms: Unbrand<XoAlarm>['id'][]
  backupsInfo: {
    lastRuns: Unbrand<VmDashboardRun>[]
    vmProtection: VmDashboard['backupsInfo']['vmProtection']
    replication: Unbrand<VmDashboard['backupsInfo']['replication']>
    backupArchives: Unbrand<VmDashboardBackupArchive>[]
  }
}
