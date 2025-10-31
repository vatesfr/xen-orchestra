import type { XoAlarm, XoHost, XoSr, XoVm, XoVmBackupArchive, XoVmBackupJob } from "@vates/types"

export type VmDashboard = {
    quickInfo: Pick<XoVm, 'id' | 'power_state' | 'uuid' | 'name_description' | 'mainIpAddress' | '$pool' | 'virtualizationMode' | 'tags' | 'startTime'> & {
        vcpu: number;
        osName?: string
        ram: number;
        createdOn: string;
        createdBy: string;
        host?: XoHost['id']
        guestTools: {
            detected: boolean;
            version?: string
            upToDate?: boolean
        };
    }
    alarms: XoAlarm['id'][]
    backupsInfo: {
        lastRun: { backupJobId: XoVmBackupJob['id']; timestamp: number; status: string }[]
        vmProtected: boolean
        replication?: { id: XoVm['id']; timestamp: number; sr?: XoSr['id'] }
        backupArchives: Pick<XoVmBackupArchive, 'id' | 'timestamp' | 'backupRepository' | 'size'>[]
    }
}
