import { createPredicate } from 'value-matcher'
import { assertValidExpression, assertValidSettingsExpression } from '@xen-orchestra/backups/backupExpressions.mjs'
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
import type { CreateBackupJobBody, CreateBackupJobSchedule, UpdateBackupJobBody } from './backup-job.type.mjs'
import { compileExpression, isExpression } from '@xen-orchestra/backups/_expressionPredicate.mjs'
import { buildRunContext, buildVmContext } from '@xen-orchestra/backups/_buildContext.mjs'

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
    this.assertJobHasValidExpressions(props.type, props)

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

  /**
   * Same checks as the JSON-RPC API (`backupNg.*Job`, `mirrorBackup.*Job`),
   * so an invalid expression is refused with a 400 instead of failing every run
   */
  assertJobHasValidExpressions(type: AnyXoBackupJob['type'], job: UpdateBackupJobBody): void {
    if (type === 'backup') {
      const { srs, remotes, vms, settings } = job as Extract<UpdateBackupJobBody, { srs?: unknown }>
      assertValidExpression('srs', srs)
      assertValidExpression('remotes', remotes)
      assertValidExpression('vms', vms)
      assertValidSettingsExpression(settings, ['healthCheckVmsWithTags', 'fullInterval'])
    } else if (type === 'mirrorBackup') {
      const { filter, remotes, settings } = job as Extract<UpdateBackupJobBody, { sourceRemote?: unknown }>
      assertValidSettingsExpression(settings, ['healthCheckVmsWithTags', 'vmFilter'])
      assertValidExpression('remotes', remotes)
      if (filter != null && filter.vm.uuid.__or.length === 0) {
        throw invalidParameters('filter must contain at least one VM', [
          { instancePath: '/filter/vm/uuid/__or', message: 'must NOT have fewer than 1 items' },
        ])
      }
    } else if (type === 'metadataBackup') {
      const { remotes, pools } = job as Extract<UpdateBackupJobBody, { pools?: unknown }>
      assertValidExpression('remotes', remotes)
      assertValidExpression('pools', pools)
    }
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

    const isVmInJob = await this.getBackupJobVmMatcher(backupJob)
    return isVmInJob(vm)
  }

  /**
   * Returns a function telling whether a VM is selected by the `vms` of the job,
   * whether it is a list of IDs, an object pattern or an expression
   */
  async getBackupJobVmMatcher(backupJob: XoVmBackupJob): Promise<(vm: XoVm) => boolean> {
    try {
      const vmIds = new Set<XoVm['id']>(extractIdsFromSimplePattern(backupJob.vms))
      return vm => vmIds.has(vm.id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      if (!isExpression(backupJob.vms)) {
        return createPredicate(backupJob.vms)
      }

      // `run:` clauses depend on the timezone, which is resolved per schedule like the executor does,
      // so the VM is in the job if it matches for at least one of its schedules
      const predicate = compileExpression(backupJob.vms)
      const now = new Date()
      const runContexts = (await this.#getScheduleTimezones(backupJob)).map(timezone => buildRunContext(now, timezone))
      return vm => runContexts.some(runContext => predicate(buildVmContext(vm, runContext)))
    }
  }

  async #getScheduleTimezones(backupJob: XoVmBackupJob): Promise<(string | undefined)[]> {
    const schedules = (await this.#restApi.xoApp.getAllSchedules()).filter(schedule => schedule.jobId === backupJob.id)
    if (schedules.length === 0) {
      return [backupJob.settings['']?.timezone]
    }

    return schedules.map(schedule => {
      const scheduleTimezone = backupJob.settings[schedule.id]?.timezone
      return typeof scheduleTimezone === 'string'
        ? scheduleTimezone
        : (backupJob.settings['']?.timezone ?? schedule.timezone)
    })
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
