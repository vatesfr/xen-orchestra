import { noSuchObject } from 'xo-common/api-errors.js'
import type { XoBackupRepository, XoVm, XoVmBackupArchive } from '@vates/types'

import type { RestApi } from '../rest-api/rest-api.mjs'

// BR uuid/xo-vm-backups/VM uuid/(ISO 8601 compact).json
const BACKUP_ARCHIVE_ID_REGEX = /^([0-9a-fA-F-]{36})\/+xo-vm-backups\/+([0-9a-fA-F-]{36})\/+(\d{8}T\d{6}Z)\.json$/

export class BackupArchiveService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async getBackupArchive(id: XoVmBackupArchive['id']): Promise<XoVmBackupArchive> {
    const match = id.match(BACKUP_ARCHIVE_ID_REGEX)
    console.log({ match })
    if (match === null) {
      throw noSuchObject(id, 'backup-archive')
    }

    const [, brId, vmId] = match as [XoVmBackupArchive['id'], XoBackupRepository['id'], XoVm['id'], string]

    console.log({ brId })
    console.log({ vmId })
    const vmBackupsNg = await this.#restApi.xoApp.listVmBackupsNg([brId])
    console.log({ vmBackupsNg })

    console.log(vmBackupsNg[brId][vmId])
    const backupArchive = (await this.#restApi.xoApp.listVmBackupsNg([brId]))[brId]?.[vmId]?.find(ba => ba.id === id)
    if (backupArchive === undefined) {
      throw noSuchObject(id, 'backup-archive')
    }

    return backupArchive
  }
}
