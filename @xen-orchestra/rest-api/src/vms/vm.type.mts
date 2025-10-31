import type { XoAlarm, XoHost, XoSr, XoVm, XoVmBackupArchive, XoVmBackupJob } from '@vates/types'

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
      date: string
      user: string
    }
    host?: XoHost['id']
    pvDriversDetected: boolean
  }
  alarms: XoAlarm['id'][]
  backupsInfo: {
    lastRun: { backupJobId: XoVmBackupJob['id']; timestamp: number; status: string }[]
    vmProtected: boolean
    replication?: { id: XoVm['id']; timestamp: number; sr?: XoSr['id'] }
    backupArchives: Pick<XoVmBackupArchive, 'id' | 'timestamp' | 'backupRepository' | 'size'>[]
  }
}
