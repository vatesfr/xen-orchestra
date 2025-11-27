import type { AnyXoLog, XoBackupLog, XoVm } from '@vates/types'

export class BackupLogService {
  isBackupLog(log: AnyXoLog): log is XoBackupLog {
    return log.message === 'backup'
  }

  getVmBackupTaskLog(log: XoBackupLog, vmId: XoVm['id']) {
    return log.tasks?.find(task => task.data?.id === vmId)
  }

  isVmInBackupLog(log: XoBackupLog, vmId: XoVm['id']) {
    const vmIds = (log.infos?.find(info => info.message === 'vms')?.data as { vms: XoVm['id'] }).vms ?? []
    return vmIds.includes(vmId)
  }
}
