import { BACKUP_TYPE, XoBackupJob, XoMetadataJob, XoMirrorJob } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'

export class JobService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async getVmJobs(): Promise<XoBackupJob[]> {
    return this.#restApi.xoApp.getAllJobs(BACKUP_TYPE.backup).then(jobs => jobs.flat(1)) as Promise<XoBackupJob[]>
  }

  async getMetadataJobs(): Promise<XoMetadataJob[]> {
    return this.#restApi.xoApp.getAllJobs(BACKUP_TYPE.metadata).then(jobs => jobs.flat(1)) as Promise<XoMetadataJob[]>
  }

  async getMirrorJobs(): Promise<XoMirrorJob[]> {
    return this.#restApi.xoApp.getAllJobs(BACKUP_TYPE.mirror).then(jobs => jobs.flat(1)) as Promise<XoMirrorJob[]>
  }
}
