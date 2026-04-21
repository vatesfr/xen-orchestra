import type { AnyXoLog, XoBackupLog, XoVm } from '@vates/types'

export class BackupLogService {
  isBackupLog(log: AnyXoLog): log is XoBackupLog {
    return log.message === 'backup'
  }

  getVmBackupTaskLog(log: XoBackupLog, vmId: XoVm['id']) {
    return log.tasks?.find(task => task.data?.id === vmId)
  }

  isVmInBackupLog(log: XoBackupLog, vmId: XoVm['id']) {
    const backupLogInfos = log.infos?.find(info => info.message === 'vms')?.data as { vms: XoVm['id'] } | undefined
    if (backupLogInfos?.vms === undefined) {
      return false
    }

    return backupLogInfos.vms.includes(vmId)
  }
}
