import { createLogger } from '@xen-orchestra/log'
import { type Defer, defer } from 'golike-defer'
import { Task } from '@vates/task'
import {
  AnyXoVm,
  VM_POWER_STATE,
  XapiXoRecord,
  XoAlarm,
  XoBackupLog,
  XoHost,
  XoNetwork,
  XoSr,
  XoUser,
  XoVbd,
  XoVdiSnapshot,
  XoVif,
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
import { VmDashboard } from './vm.type.mjs'
import { BackupLogService } from '../backup-logs/backup-log.service.mjs'

const log = createLogger('xo:rest-api:vm-service')

export class VmService {
  #restApi: RestApi
  #alarmService: AlarmService
  #backupJobService: BackupJobService
  #backupLogService: BackupLogService
  constructor(restApi: RestApi) {
    this.#restApi = restApi
    this.#alarmService = restApi.ioc.get(AlarmService)
    this.#backupJobService = restApi.ioc.get(BackupJobService)
    this.#backupLogService = restApi.ioc.get(BackupLogService)
  }

  async #create(
    $defer: Defer,
    params: CreateVmParams &
      CreateVmAfterCreateParams & {
        pool: XoPool['id']
        template: XoVmTemplate['uuid']
      }
  ): Promise<XoVm['id']> {
    const { pool, template, cloud_config, boot, destroy_cloud_config_vdi, network_config, createVtpm, ...rest } = params
    const xoApp = this.#restApi.xoApp
    const xapi = xoApp.getXapi(pool)
    const currentUser = this.#restApi.getCurrentUser()

    const xapiVm = await xapi.createVm(template, rest, undefined, currentUser.id)
    $defer.onFailure(() => xapi.VM_destroy(xapiVm.$ref))
    const xoVm = this.#restApi.getObject<XoVm>(xapiVm.uuid as XoVm['id'], 'VM')

    if (createVtpm) {
      const vtpmRef = await xapi.VTPM_create({ VM: xapiVm.$ref })
      $defer.onFailure(() => xapi.call('VTPM.destroy', vtpmRef))
    }

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
      active: nRunning + nPaused,
      inactive: nHalted + nSuspended,
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
  getVmVdis(id: XoVmController['id'], vmType: 'VM-controller'): XoVdi[]
  getVmVdis<T extends AnyXoVm, VdiType extends XapiXoRecord = T['type'] extends 'VM-snapshot' ? XoVdiSnapshot : XoVdi>(
    id: T['id'],
    vmType: T['type']
  ): VdiType[] {
    const getObject = this.#restApi.getObject.bind(this.#restApi)
    const vdis: VdiType[] = []

    const vm = getObject<T>(id, vmType)

    for (const vbdId of vm.$VBDs) {
      const vbd = getObject<XoVbd>(vbdId, 'VBD')
      if (vbd.VDI !== undefined) {
        const vdi = getObject<VdiType>(vbd.VDI, [vmType === 'VM-snapshot' ? 'VDI-snapshot' : 'VDI'])
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

  getVmAlarms(
    id: XoVm['id'],
    { filter, limit }: { filter?: string; limit?: number } = {}
  ): Record<XoAlarm['id'], XoAlarm> {
    const vm = this.#restApi.getObject<XoVm>(id, 'VM')

    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vm.id}`,
      limit,
    })

    return alarms
  }

  #getDashboardQuickInfo(id: XoVm['id']): VmDashboard['quickInfo'] {
    const {
      power_state,
      uuid,
      name_description,
      CPUs,
      mainIpAddress,
      os_version,
      memory,
      creation,
      $pool,
      virtualizationMode,
      tags,
      $container,
      startTime,
      pvDriversDetected,
      pvDriversVersion,
      pvDriversUpToDate,
    } = this.#restApi.getObject<XoVm>(id, 'VM')

    return {
      id,
      power_state,
      uuid,
      name_description,
      CPUs: {
        number: CPUs.number,
      },
      mainIpAddress,
      os_version: {
        name: os_version?.name,
      },
      memory: {
        size: memory.size,
      },
      creation: {
        date: creation?.date,
        user: creation?.user as XoUser['id'],
      },
      $pool,
      virtualizationMode,
      tags,
      host: $container === $pool ? undefined : ($container as XoHost['id']),
      pvDriversDetected: pvDriversDetected ?? false,
      pvDriversVersion,
      pvDriversUpToDate,
      startTime,
    }
  }

  #getLastReplication(id: XoVm['id']): VmDashboard['backupsInfo']['replication'] {
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
      return {}
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
      timestamp: lastTimestamp! * 1000,
      sr,
    }
  }

  async #getBackupsInfo(id: XoVm['id']): Promise<Pick<VmDashboard['backupsInfo'], 'vmProtection' | 'lastRuns'>> {
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
      filter: log =>
        this.#backupLogService.isBackupLog(log) &&
        relevantJobIds.includes(log.jobId as XoVmBackupJob['id']) &&
        this.#backupLogService.isVmInBackupLog(log, id),
    })) as XoBackupLog[]

    const lastBackupRuns = backupLogs
      .slice(-3)
      .reverse()
      .map(log => {
        let status: XoBackupLog['status']
        if (log.status === 'success') {
          status = log.status
        } else {
          const vmTaskLog = this.#backupLogService.getVmBackupTaskLog(log, id)
          status = vmTaskLog!.status
        }

        return {
          backupJobId: log.jobId,
          timestamp: log.end,
          status,
        }
      }) as { backupJobId: XoVmBackupJob['id']; timestamp: number; status: string }[]

    let vmProtection: VmDashboard['backupsInfo']['vmProtection'] = 'not-in-active-job'
    if (!vmContainsNoBakTag(vm)) {
      const backupLogsByJob = groupBy(backupLogs, 'jobId')

      for (const backupJob of relevantJobsWithSchedule) {
        if (vmProtection === 'protected') {
          break
        }

        vmProtection = 'unprotected'
        // can be undefined if the backup did run for now
        const jobLogs: XoBackupLog[] | undefined = backupLogsByJob[backupJob.id]
          ?.filter(log => log.status !== 'pending')
          .slice(-3)

        if (jobLogs !== undefined) {
          vmProtection = jobLogs.every(log => {
            if (log.status === 'success') {
              return true
            }

            const vmTaskLog = this.#backupLogService.getVmBackupTaskLog(log, id)
            return vmTaskLog?.status === 'success'
          })
            ? 'protected'
            : 'unprotected'
        }
      }
    }

    return { lastRuns: lastBackupRuns, vmProtection }
  }

  async #getLastVmBackupArchives(id: XoVm['id']): Promise<VmDashboard['backupsInfo']['backupArchives']> {
    const vm = this.#restApi.getObject<XoVm>(id, 'VM')

    const brIds = (await this.#restApi.xoApp.getAllRemotes()).map(br => br.id)
    const backupArchivesByVmByBr = await this.#restApi.xoApp.listVmBackupsNg(brIds, { vmId: vm.id })

    return Object.values(backupArchivesByVmByBr)
      .filter(backupArchiveByVm => backupArchiveByVm !== undefined)
      .flatMap(backupArchiveByVm => backupArchiveByVm[vm.id] ?? [])
      .sort((a, b) => b.timestamp - a.timestamp)
      .splice(0, 3)
      .map(ba => ({ id: ba.id, timestamp: ba.timestamp, backupRepository: ba.backupRepository, size: ba.size }))
  }

  async getVmDashboard(id: XoVm['id'], { stream }: { stream?: Writable } = {}): Promise<VmDashboard> {
    const [quickInfo, alarms, lastReplication, { lastRuns, vmProtection }, lastBackupArchives] = await Promise.all([
      promiseWriteInStream({ maybePromise: this.#getDashboardQuickInfo(id), path: 'quickInfo', stream }),
      promiseWriteInStream({ maybePromise: Object.keys(this.getVmAlarms(id)), path: 'alarms', stream }),
      promiseWriteInStream({ maybePromise: this.#getLastReplication(id), path: 'backupsInfo.replication', stream }),
      promiseWriteInStream({ maybePromise: this.#getBackupsInfo(id), path: 'backupsInfo', stream }),
      promiseWriteInStream({
        maybePromise: this.#getLastVmBackupArchives(id),
        path: 'backupsInfo.backupArchives',
        stream,
      }),
    ])

    return {
      quickInfo,
      alarms: alarms as XoAlarm['id'][],
      backupsInfo: {
        lastRuns,
        vmProtection,
        replication: lastReplication,
        backupArchives: lastBackupArchives,
      },
    }
  }

  getNetwork(id: string): XoNetwork {
    return this.#restApi.getObject<XoNetwork>(id as XoNetwork['id'], 'network')
  }

  getVif(id: string): XoVif {
    return this.#restApi.getObject<XoVif>(id as XoVif['id'], 'VIF')
  }
}
