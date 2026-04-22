import type { AnyXoLog, XoBackupLog, XoRestoreLog, XoVm } from '@vates/types'
import { noSuchObject } from 'xo-common/api-errors.js'
import type { RestApi } from '../rest-api/rest-api.mjs'

export class BackupLogService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  isBackupLog(log: AnyXoLog): log is XoBackupLog {
    return log.message === 'backup'
  }

  async getBackupLog(id: AnyXoLog['id']): Promise<XoBackupLog> {
    const log = await this.#restApi.xoApp.getBackupNgLogs(id)
    if (!this.isBackupLog(log)) {
      throw noSuchObject('backup-log')
    }
    return log
  }

  async getRestoreLog(id: AnyXoLog['id']): Promise<XoRestoreLog> {
    const log = await this.#restApi.xoApp.getBackupNgLogs(id)
    if (this.isBackupLog(log)) {
      throw noSuchObject('restore-log')
    }
    return log
  }

  getVmBackupTaskLog(log: XoBackupLog, vmId: XoVm['id']) {
    return log.tasks?.find(task => task.data?.id === vmId)
  }

  isVmInBackupLog(log: XoBackupLog, vmId: XoVm['id']) {
    const vmIds = (log.infos?.find(info => info.message === 'vms')?.data as { vms: XoVm['id'] }).vms ?? []
    return vmIds.includes(vmId)
  }
}
