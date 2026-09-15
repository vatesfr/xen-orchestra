import type { XoVmBackupArchive } from '@vates/types'

import type { RestApi } from '../rest-api/rest-api.mjs'

export class BackupArchiveService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async getBackupArchive(id: XoVmBackupArchive['id']): Promise<XoVmBackupArchive> {
    return this.#restApi.xoApp.getVmBackupArchive(id)
  }
}
