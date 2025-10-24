import { createLogger } from '@xen-orchestra/log'
import { type Defer, defer } from 'golike-defer'
import { Task } from '@vates/task'
import {
  AnyXoVm,
  VM_POWER_STATE,
  XoBackupLog,
  XoSr,
  XoVbd,
  XoVdiSnapshot,
  XoVmBackupJob,
  XoVmController,
  XoVmSnapshot,
  type XenApiVdiWrapped,
  type XoPool,
  type XoVdi,
  type XoVm,
  type XoVmTemplate,
} from '@vates/types'
import { Response as ExResponse } from 'express'
import { Readable, Writable } from 'node:stream'

import type { CreateVmAfterCreateParams, CreateVmParams } from '../pools/pool.type.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { escapeUnsafeComplexMatcher, promiseWriteInStream, vmContainsNoBakTag } from '../helpers/utils.helper.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { parseDateTime } from '@xen-orchestra/xapi'
import { BackupJobService } from '../backup-jobs/backup-job.service.mjs'
import groupBy from 'lodash/groupBy.js'

const log = createLogger('xo:rest-api:vm-service')

export class VmService {
  #restApi: RestApi
  #alarmService: AlarmService
  #backupJobService: BackupJobService
  constructor(restApi: RestApi) {
    this.#restApi = restApi
    this.#alarmService = restApi.ioc.get(AlarmService)
    this.#backupJobService = restApi.ioc.get(BackupJobService)
  }

  async #create(
    $defer: Defer,
    params: CreateVmParams &
      CreateVmAfterCreateParams & {
        pool: XoPool['id']
        template: XoVmTemplate['uuid']
      }
  ): Promise<XoVm['id']> {
    const { pool, template, cloud_config, boot, destroy_cloud_config_vdi, network_config, ...rest } = params
    const xoApp = this.#restApi.xoApp
    const xapi = xoApp.getXapi(pool)
    const currentUser = this.#restApi.getCurrentUser()

    const xapiVm = await xapi.createVm(template, rest, undefined, currentUser.id)
    $defer.onFailure(() => xapi.VM_destroy(xapiVm.$ref))
    const xoVm = this.#restApi.getObject<XoVm>(xapiVm.uuid as XoVm['id'], 'VM')

    let cloudConfigVdi: XenApiVdiWrapped | undefined
    if (cloud_config !== undefined) {
      const cloudConfigVdiUuid = await xapi.VM_createCloudInitConfig(xapiVm.$ref, cloud_config, {
        networkConfig: network_config,
      })
      cloudConfigVdi = xoApp.getXapiObject<XoVdi>(cloudConfigVdiUuid as XoVdi['id'], 'VDI')
    }

    let timeLimit: number | undefined
    if (boot) {
      timeLimit = Date.now() + 10 * 60 * 1000
      await xapiVm.$callAsync('start', false, false)
    }

    if (destroy_cloud_config_vdi && cloudConfigVdi !== undefined && boot) {
      Task.info('Destruction of the cloud config VDI is planned and will be done as soon as possible')
      xapi.VDI_destroyCloudInitConfig(cloudConfigVdi.$ref, { timeLimit }).catch(error => {
        log.error('destroy cloud init config VDI failed', {
          error,
          vdi: {
            uuid: cloudConfigVdi.uuid,
          },
          vm: {
            uuid: xoVm.uuid,
          },
        })
      })
    }
    return xoVm.id
  }
  create = defer(this.#create)

  getVmsStatus(opts?: { filter?: string | ((obj: XoVm) => boolean) }) {
    const vms = this.#restApi.getObjectsByType<XoVm>('VM', opts)

    let nRunning = 0
    let nPaused = 0
    let nSuspended = 0
    let nHalted = 0
    let nUnknown = 0
    let total = 0

    for (const id in vms) {
      total++
      const vm = vms[id as XoVm['id']]

      switch (vm.power_state) {
        case VM_POWER_STATE.RUNNING:
          nRunning++
          break
        case VM_POWER_STATE.HALTED:
          nHalted++
          break
        case VM_POWER_STATE.PAUSED:
          nPaused++
          break
        case VM_POWER_STATE.SUSPENDED:
          nSuspended++
          break
        default:
          log.warn('Invalid VM power_state', vm.id, vm.power_state)
          nUnknown++
          break
      }
    }

    return {
      running: nRunning,
      halted: nHalted,
      paused: nPaused,
      suspended: nSuspended,
      unknown: nUnknown,
      total,
    }
  }

  getVmVdis(id: XoVm['id'], vmType: 'VM'): XoVdi[]
  getVmVdis(id: XoVmTemplate['id'], vmType: 'VM-template'): XoVdi[]
  getVmVdis(id: XoVmSnapshot['id'], vmType: 'VM-snapshot'): XoVdiSnapshot[]
  getVmVdis(id: XoVmController['id'], vmType: 'VM-controller'): (XoVdi | XoVdiSnapshot)[]
  getVmVdis<T extends AnyXoVm>(id: T['id'], vmType: T['type']): (XoVdi | XoVdiSnapshot)[] {
    const getObject = this.#restApi.getObject.bind(this.#restApi)
    const vdis: (XoVdi | XoVdiSnapshot)[] = []

    const vm = getObject<T>(id, vmType)

    for (const vbdId of vm.$VBDs) {
      const vbd = getObject<XoVbd>(vbdId, 'VBD')
      if (vbd.VDI !== undefined) {
        const vdi = getObject<XoVdi | XoVdiSnapshot>(vbd.VDI, ['VDI-snapshot', 'VDI'])
        vdis.push(vdi)
      }
    }

    return vdis
  }

  async export<Vm extends XoVm | XoVmSnapshot | XoVmTemplate>(
    id: Vm['id'],
    vmType: Vm['type'],
    { compress, format, response }: { compress?: boolean; format: 'ova' | 'xva'; response?: ExResponse }
  ): Promise<Readable> {
    const xapiVm = this.#restApi.getXapiObject(id, vmType)

    let stream: Readable
    if (format === 'xva') {
      stream = (await xapiVm.$xapi.VM_export(xapiVm.$ref, { compress })).body
    } else {
      stream = await xapiVm.$xapi.exportVmOva(xapiVm.$ref)
    }

    if (response !== undefined) {
      const headers = new Headers({
        'content-disposition': `attachment; filename=${id}.${format}`,
        'content-type': 'application/octet-stream',
      })

      response.setHeaders(headers)
    }

    return stream
  }

  getVmAlarms(id: XoVm['id'], { filter, limit }: { filter?: string; limit?: number } = {}) {
    const vm = this.#restApi.getObject<XoVm>(id, 'VM')

    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vm.id}`,
      limit,
    })

    return alarms
  }

  #getDashboardQuickInfo(id: XoVm['id']) {
    const vm = this.#restApi.getObject<XoVm>(id, 'VM')

    return {
      id: vm.id,
      state: vm.power_state,
      uuid: vm.uuid,
      description: vm.name_description,
      vcpu: vm.CPUs.number,
      ipAddress: vm.mainIpAddress,
      osName: vm.os_version?.name,
      ram: vm.memory.size,
      createdOn: vm.creation.date,
      pool: vm.$pool,
      virtualisationType: vm.virtualizationMode,
      tags: vm.tags,
      createdBy: vm.creation.user,
      host: vm.$container,
      guestTools: {
        detected: vm.pvDriversDetected ?? false,
        version: vm.pvDriversVersion,
        upToDate: vm.pvDriversUpToDate,
      },
      started: vm.startTime,
    }
  }

  #getLastReplication(id: XoVm['id']): undefined | { id: XoVm['id']; date: number; sr: XoSr['id'] | undefined } {
    const vm = this.#restApi.getObject<XoVm>(id, 'VM')
    const replicatedVms = this.#restApi.getObjectsByType<XoVm>('VM', {
      filter: obj => obj.other['xo:backup:vm'] === vm.id,
    })

    let lastTimestamp: number | undefined
    let lastReplica: XoVm | undefined
    for (const id in replicatedVms) {
      const replica = replicatedVms[id as XoVm['id']]
      const timestamp = parseDateTime(replica.other['xo:backup:datetime'])

      if (lastTimestamp === undefined || lastTimestamp < timestamp) {
        lastTimestamp = timestamp
        lastReplica = replica
      }
    }

    if (lastReplica === undefined) {
      return
    }

    const vdis = this.getVmVdis(id, 'VM')
    let sr: XoSr['id'] | undefined = undefined
    for (const vdi of vdis) {
      if (sr === undefined) {
        sr = vdi.$SR
        continue
      }

      if (sr !== vdi.$SR) {
        // if the VM has VDIs on multiple SRs, set the sr as undefined
        sr = undefined
        break
      }
    }

    return {
      id: lastReplica.id,
      date: lastTimestamp! * 1000,
      sr,
    }
  }

  async #getBackupsInfo(id: XoVm['id']): Promise<{
    lastRun: { backupJobId: XoVmBackupJob['id']; timestamp: number; status: string }[]
    vmProtected: boolean
  }> {
    const vm = this.#restApi.getObject<XoVm>(id, 'VM')

    const allBackupJobs = await this.#restApi.xoApp.getAllJobs('backup')

    const relevantJobIds: XoVmBackupJob['id'][] = []
    const relevantJobsWithSchedule: XoVmBackupJob[] = []

    for (const backupJob of allBackupJobs) {
      if (await this.#backupJobService.isVmInBackupJob(backupJob.id, vm.id)) {
        relevantJobIds.push(backupJob.id)

        if (await this.#backupJobService.backupJobHasAtLeastOneScheduleEnabled(backupJob.id)) {
          relevantJobsWithSchedule.push(backupJob)
        }
      }
    }

    const backupLogs = (await this.#restApi.xoApp.getBackupNgLogsSorted({
      filter: log => log.message === 'backup' && relevantJobIds.includes(log.jobId as XoVmBackupJob['id']),
    })) as XoBackupLog[]

    const lastBackupRun = backupLogs
      .slice(-3)
      .reverse()
      .map(log => ({
        backupJobId: log.jobId,
        timestamp: log.end,
        status: log.status,
      })) as { backupJobId: XoVmBackupJob['id']; timestamp: number; status: string }[]

    let isProtected = false
    if (!vmContainsNoBakTag(vm)) {
      const backupLogsByJob = groupBy(backupLogs, 'jobId')

      for (const backupJob of relevantJobsWithSchedule) {
        if (isProtected) {
          break
        }
        // can be undefined if the backup did run for now
        const jobLogs: XoBackupLog[] | undefined = backupLogsByJob[backupJob.id]
          ?.filter(log => log.status !== 'pending')
          .slice(-3)

        if (jobLogs !== undefined) {
          isProtected = jobLogs.every(log => {
            if (log.status === 'success') {
              return true
            }

            const backupTask = (log.tasks as { data: { id: XoVm['id'] }; status: string }[]).find(
              task => task.data.id === vm.id
            )
            return backupTask?.status === 'success'
          })
        }
      }
    }

    return { lastRun: lastBackupRun, vmProtected: isProtected }
  }

  async getVmDashboard(id: XoVm['id'], { stream }: { stream?: Writable } = {}) {
    const [quickInfo, alarms, lastReplication, backupsInfo] = await Promise.all([
      promiseWriteInStream({ maybePromise: this.#getDashboardQuickInfo(id), path: 'quickInfo', stream }),
      promiseWriteInStream({ maybePromise: Object.keys(this.getVmAlarms(id)), path: 'alarms', stream }),
      promiseWriteInStream({ maybePromise: this.#getLastReplication(id), path: 'lastReplication', stream }),
      promiseWriteInStream({ maybePromise: this.#getBackupsInfo(id), path: 'backupsInfo', stream }),
    ])

    // last backup archives

    return {
      quickInfo,
      alarms,
      lastReplication,
      backupsInfo,
    }
  }
}
