import { createPredicate } from 'value-matcher'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import type { XoBackupJob, XoVm } from '@vates/types'

import type { RestApi } from '../rest-api/rest-api.mjs'

const NO_BAK_TAG = 'xo:no-bak'

export class BackupService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async isVmInBackupJob(backupJobId: XoBackupJob['id'], vmId: XoVm['id']): Promise<boolean> {
    const backupJob = await this.#restApi.xoApp.getJob<XoBackupJob>(backupJobId)
    const vm = this.#restApi.getObject<XoVm>(vmId, 'VM')

    if (vm.tags.includes(NO_BAK_TAG)) {
      return false
    }

    try {
      const vmIds: XoVm['id'][] = extractIdsFromSimplePattern(backupJob.vms)
      return vmIds.some(id => id === vm.id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      const predicate = createPredicate(backupJob.vms)
      return predicate(vm)
    }
  }
}
