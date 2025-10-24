import { createPredicate } from 'value-matcher'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { noSuchObject } from 'xo-common/api-errors.js'
import type { XoVmBackupJob, XoVm, XoSchedule } from '@vates/types'

import type { RestApi } from '../rest-api/rest-api.mjs'
import { vmContainsNoBakTag } from '../helpers/utils.helper.mjs'

export class BackupJobService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async isVmInBackupJob(backupJobId: XoVmBackupJob['id'], vmId: XoVm['id']): Promise<boolean> {
    const backupJob = await this.#restApi.xoApp.getJob<XoVmBackupJob>(backupJobId)
    const vm = this.#restApi.getObject<XoVm>(vmId, 'VM')

    if (vmContainsNoBakTag(vm)) {
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

  async backupJobHasAtLeastOneScheduleEnabled(id: XoVmBackupJob['id']): Promise<boolean> {
    const backupJob = await this.#restApi.xoApp.getJob<XoVmBackupJob>(id)

    for (const maybeScheduleId in backupJob.settings) {
      if (maybeScheduleId === '') {
        continue
      }

      try {
        const schedule = await this.#restApi.xoApp.getSchedule(maybeScheduleId as XoSchedule['id'])
        if (schedule.enabled) {
          return true
        }
      } catch (error) {
        if (!noSuchObject.is(error, { id: maybeScheduleId, type: 'schedule' })) {
          console.error(error)
        }
        continue
      }
    }
    return false
  }
}
