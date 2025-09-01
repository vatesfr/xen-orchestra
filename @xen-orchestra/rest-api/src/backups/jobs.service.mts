import { BACKUP_TYPE, XoBackupJob, XoMetadataJob, XoMirrorJob } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'

export class JobService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async getVmJobs(): Promise<XoBackupJob[]> {
    return this.#restApi.xoApp.getAllJobs(BACKUP_TYPE.backup)
  }

  async getMetadataJobs(): Promise<XoMetadataJob[]> {
    return this.#restApi.xoApp.getAllJobs(BACKUP_TYPE.metadata)
  }

  async getMirrorJobs(): Promise<XoMirrorJob[]> {
    return this.#restApi.xoApp.getAllJobs(BACKUP_TYPE.mirror)
  }
}
