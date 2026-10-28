import { createPredicate } from 'value-matcher'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'
import type {
  XoVmBackupJob,
  XoVm,
  XoSchedule,
  AnyXoJob,
  AnyXoBackupJob,
  XoMetadataBackupJob,
  XoMirrorBackupJob,
} from '@vates/types'

import type { RestApi } from '../rest-api/rest-api.mjs'
import { assertValidCron, vmContainsNoBakTag } from '../helpers/utils.helper.mjs'
import type { CreateBackupJobBody, CreateBackupJobSchedule } from './backup-job.type.mjs'

export class BackupJobService {
  #backupJobTypes = ['backup', 'metadataBackup', 'mirrorBackup']
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async getBackupJob(id: AnyXoBackupJob['id']): Promise<AnyXoBackupJob> {
    const job = await this.#restApi.xoApp.getJob(id)
    if (!this.isBackupJob(job)) {
      throw noSuchObject(id, 'backup-job')
    }

    return job
  }

  async createBackupJob({ schedules: _schedules = {}, ...props }: CreateBackupJobBody): Promise<AnyXoBackupJob> {
    const xoApp = this.#restApi.xoApp

    const schedules: Record<string, Pick<XoSchedule, 'cron' | 'enabled' | 'name' | 'timezone'>> = {}
    for (const [tmpId, { enabled = false, ...schedule }] of Object.entries<CreateBackupJobSchedule>(_schedules)) {
      // `''` is the key of the general settings, xo-server would move them to the schedule
      if (tmpId === '') {
        throw invalidParameters('schedule temporary ID cannot be an empty string')
      }
      assertValidCron(schedule.cron, schedule.timezone)
      schedules[tmpId] = { ...schedule, enabled }
    }

    if (props.type === 'metadataBackup') {
      const userId = this.#restApi.getCurrentUser().id
      return xoApp.createMetadataBackupJob(
        { ...props, userId } as unknown as Omit<XoMetadataBackupJob, 'id' | 'type'>,
        schedules
      )
    }

    const { type, ...job } = props
    return xoApp.createBackupNgJob<XoVmBackupJob | XoMirrorBackupJob>(
      type,
      job as unknown as Omit<XoVmBackupJob | XoMirrorBackupJob, 'id' | 'type'>,
      schedules
    )
  }

  isBackupJob(anyJob: AnyXoJob): anyJob is AnyXoBackupJob {
    return this.#backupJobTypes.includes(anyJob.type)
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

        const scheduleSequence = await this.#restApi.xoApp.findEnabledScheduleSequenceFromSchedule(schedule.id)
        if (scheduleSequence !== undefined) {
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
