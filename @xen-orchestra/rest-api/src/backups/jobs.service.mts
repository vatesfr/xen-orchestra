import { BACKUP_TYPE, XoBackupJob, XoMetadataBackupJob, XoMirrorBackupJob } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'

export class JobService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async getVmJobs(): Promise<XoBackupJob[]> {
    return this.#restApi.xoApp.getAllJobs(BACKUP_TYPE.backup)
  }

  async getMetadataJobs(): Promise<XoMetadataBackupJob[]> {
    return this.#restApi.xoApp.getAllJobs(BACKUP_TYPE.metadata)
  }

  async getMirrorJobs(): Promise<XoMirrorBackupJob[]> {
    return this.#restApi.xoApp.getAllJobs(BACKUP_TYPE.mirror)
  }
}
