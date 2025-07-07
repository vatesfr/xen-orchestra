import groupBy from 'lodash/groupBy.js'
import semver from 'semver'
import {
  AnyXoVdi,
  AnyXoVm,
  BACKUP_TYPE,
  HOST_POWER_STATE,
  VM_POWER_STATE,
  XoBackupJob,
  XoHost,
  XoPool,
  XoSchedule,
  XoSr,
  XoVbd,
  XoVm,
} from '@vates/types'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { createPredicate } from 'value-matcher'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { isPromise } from 'node:util/types'
import { noSuchObject } from 'xo-common/api-errors.js'
import { parse } from 'xo-remote-parser'
import { Writable } from 'node:stream'

import { type AsyncCacheEntry, getFromAsyncCache } from '../helpers/cache.helper.mjs'
import { DashboardBackupRepositoriesSizeInfo, DashboardBackupsInfo, XoaDashboard } from './xoa.type.mjs'
import { isReplicaVm, isSrWritable, vmContainsNoBakTag } from '../helpers/utils.helper.mjs'
import type { MaybePromise } from '../helpers/helper.type.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:xoa-service')

type DashboardAsyncCache = {
  backupRepositories: MaybePromise<DashboardBackupRepositoriesSizeInfo>
  backups: MaybePromise<DashboardBackupsInfo>
}

export class XoaService {
  #restApi: RestApi
  #dashboardAsyncCache = new Map<
    keyof DashboardAsyncCache,
    AsyncCacheEntry<DashboardAsyncCache[keyof DashboardAsyncCache]>
  >()
  #dashboardCacheOpts: { timeout?: number; expiresIn?: number }

  constructor(restApi: RestApi) {
    this.#restApi = restApi
    this.#dashboardCacheOpts = {
      timeout: this.#restApi.xoApp.config.getOptionalDuration('rest-api.dashboardCacheTimeout') ?? 60000,
      expiresIn: this.#restApi.xoApp.config.getOptionalDuration('rest-api.dashboardCacheExpiresIn'),
    }
  }

  async #getBackupRepositoriesSizeInfo(): Promise<
    (DashboardBackupRepositoriesSizeInfo & { isExpired?: true }) | undefined
  > {
    const brResult = await getFromAsyncCache<DashboardAsyncCache['backupRepositories']>(
      this.#dashboardAsyncCache as Map<
        'backupRepositories',
        AsyncCacheEntry<DashboardAsyncCache['backupRepositories']>
      >,
      'backupRepositories',
      async () => {
        const xoApp = this.#restApi.xoApp

        const s3Brsize: DashboardBackupRepositoriesSizeInfo['s3']['size'] = { backups: 0 }
        const otherBrSize: DashboardBackupRepositoriesSizeInfo['other']['size'] = {
          available: 0,
          backups: 0,
          other: 0,
          total: 0,
          used: 0,
        }

        const backupRepositories = await xoApp.getAllRemotes()
        const backupRepositoriesInfo = await xoApp.getAllRemotesInfo()
        for (const backupRepository of backupRepositories) {
          const { type } = parse(backupRepository.url)
          const backupRepositoryInfo = backupRepositoriesInfo[backupRepository.id]

          if (!backupRepository.enabled || backupRepositoryInfo === undefined) {
            continue
          }

          const totalBackupSize = await xoApp.getTotalBackupSizeOnRemote(backupRepository.id)

          const { available, size, used } = backupRepositoryInfo

          const isS3 = type === 's3'
          const target = isS3 ? s3Brsize : otherBrSize

          target.backups += totalBackupSize.onDisk
          if (!isS3) {
            const _target = target as DashboardBackupRepositoriesSizeInfo['other']['size']
            _target.available += available ?? 0
            _target.other += used - totalBackupSize.onDisk
            _target.total += size ?? 0
            _target.used += used
          }
        }

        return { s3: { size: s3Brsize }, other: { size: otherBrSize } }
      },
      this.#dashboardCacheOpts
    )

    if (brResult?.value !== undefined) {
      return { ...brResult.value, isExpired: brResult.isExpired }
    }
  }

  #getNumberOfPools() {
    const pools = this.#restApi.getObjectsByType<XoPool>('pool')
    return Object.keys(pools).length
  }

  #getNumberOfHosts() {
    const hosts = this.#restApi.getObjectsByType<XoHost>('host')
    return Object.keys(hosts).length
  }

  #getResourcesOverview(): XoaDashboard['resourcesOverview'] {
    const pools = Object.values(this.#restApi.getObjectsByType<XoPool>('pool'))
    const hosts = Object.values(this.#restApi.getObjectsByType<XoHost>('host'))
    const writableSrs = Object.values(
      this.#restApi.getObjectsByType<XoSr>('SR', {
        filter: isSrWritable,
      })
    )

    const maxLenght = Math.max(hosts.length, writableSrs.length)

    const resourcesOverview = { nCpus: 0, memorySize: 0, srSize: 0 }
    for (let index = 0; index < maxLenght; index++) {
      const pool = pools[index]
      const host = hosts[index]
      const sr = writableSrs[index]

      if (pool !== undefined) {
        resourcesOverview.nCpus += pool.cpus.cores ?? 0
      }
      if (host !== undefined) {
        resourcesOverview.memorySize += host.memory.size
      }
      if (sr !== undefined) {
        resourcesOverview.srSize += sr.size
      }
    }

    return resourcesOverview
  }

  async #getPoolsStatus(): Promise<XoaDashboard['poolsStatus']> {
    const servers = await this.#restApi.xoApp.getAllXenServers()
    const pools = this.#restApi.getObjectsByType<XoPool>('pool')

    let nConnectedServers = 0
    let nUnreachableServers = 0
    let nUnknownServers = 0
    servers.forEach(server => {
      // it may happen that some servers are marked as "connected", but no pool matches "server.pool"
      // so they are counted as `nUnknownServers`
      if (server.status === 'connected' && server.poolId !== undefined && pools[server.poolId] !== undefined) {
        nConnectedServers++
        return
      }

      if (
        server.status === 'disconnected' &&
        server.error !== undefined &&
        server.error.connectedServerId === undefined
      ) {
        nUnreachableServers++
        return
      }

      if (server.status === 'disconnected') {
        return
      }

      nUnknownServers++
    })

    return {
      connected: nConnectedServers,
      unreachable: nUnreachableServers,
      unknown: nUnknownServers,
    }
  }

  async #getNumberOfEolHosts(): Promise<XoaDashboard['nHostsEol']> {
    const getHVSupportedVersions = this.#restApi.xoApp.getHVSupportedVersions

    if (getHVSupportedVersions === undefined) {
      return
    }

    const hvSupportedVersions = await getHVSupportedVersions()

    const hosts = this.#restApi.getObjectsByType<XoHost>('host')
    let nHostsEol = 0

    for (const hostId in hosts) {
      const host = hosts[hostId as XoHost['id']]
      if (!semver.satisfies(host.version, hvSupportedVersions[host.productBrand])) {
        nHostsEol++
      }
    }

    return nHostsEol
  }

  async #getMissingPatchesInfo(): Promise<XoaDashboard['missingPatches']> {
    if (!(await this.#restApi.xoApp.hasFeatureAuthorization('LIST_MISSING_PATCHES'))) {
      return {
        hasAuthorization: false,
      }
    }

    const hosts = Object.values(this.#restApi.getObjectsByType<XoHost>('host'))
    const poolsWithMissingPatches = new Set()
    let nHostsWithMissingPatches = 0
    let nHostsFailed = 0

    await asyncEach(hosts, async (host: XoHost) => {
      const xapi = this.#restApi.xoApp.getXapi(host)

      try {
        const patches = await xapi.listMissingPatches(host.id)

        if (patches.length > 0) {
          nHostsWithMissingPatches++
          poolsWithMissingPatches.add(host.$pool)
        }
      } catch (err) {
        log.error('listMissingPatches failed', err)
        nHostsFailed++
      }
    })

    return {
      hasAuthorization: true,
      nHostsFailed,
      nHostsWithMissingPatches,
      nPoolsWithMissingPatches: poolsWithMissingPatches.size,
    }
  }

  #isReplicaVmInVdb(vbds: XoVbd['id'][]): boolean {
    for (const vbd of vbds) {
      try {
        const vdbObject = this.#restApi.getObject<XoVbd>(vbd)
        const { VM } = vdbObject
        const vmObject = this.#restApi.getObject<AnyXoVm>(VM)
        return isReplicaVm(vmObject)
      } catch (err) {
        if (!noSuchObject.is(err)) {
          throw err
        }
      }
    }
    return false
  }

  #calculateReplicatedSize(vdiId: AnyXoVdi['id'], cache: Set<AnyXoVdi['id']>): number {
    if (cache.has(vdiId)) {
      return 0
    }

    let vdiObject: AnyXoVdi
    try {
      vdiObject = this.#restApi.getObject<AnyXoVdi>(vdiId)
      cache.add(vdiId)
    } catch (err) {
      if (!noSuchObject.is(err)) {
        throw err
      }
      return 0
    }

    const { parent, usage, $VBDs } = vdiObject
    const replicaUsage = this.#isReplicaVmInVdb($VBDs) && usage ? usage : 0
    const parentUsage = parent ? this.#calculateReplicatedSize(parent, cache) : 0

    return replicaUsage + parentUsage
  }

  #getStorageRepositoriesSizeInfo() {
    const writableSrs = this.#restApi.getObjectsByType<XoSr>('SR', {
      filter: isSrWritable,
    })

    let replicated = 0
    let total = 0
    let used = 0

    for (const srId in writableSrs) {
      const sr = writableSrs[srId as XoSr['id']]

      const cache = new Set<AnyXoVdi['id']>()
      const { VDIs } = sr

      replicated += VDIs.reduce((total, vdi) => total + this.#calculateReplicatedSize(vdi, cache), 0)
      total += sr.size
      used += sr.physical_usage
    }

    return {
      size: { available: total - used, other: used - replicated, replicated, total, used },
    }
  }

  async #getbackupsInfo(): Promise<(DashboardBackupsInfo & { isExpired?: true }) | undefined> {
    const vmIdsProtected = new Set<XoVm['id']>()
    const vmIdsUnprotected = new Set<XoVm['id']>()
    const nonReplicaVms = Object.values(this.#restApi.getObjectsByType<XoVm>('VM', { filter: vm => !isReplicaVm(vm) }))
    const restApi = this.#restApi
    const xoApp = restApi.xoApp
    function _extractVmIdsFromBackupJob(job: XoBackupJob) {
      let vmIds: XoVm['id'][]
      try {
        vmIds = extractIdsFromSimplePattern(job.vms)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        const predicate = createPredicate(job.vms)
        vmIds = nonReplicaVms.filter(predicate).map(vm => vm.id)
      }
      return vmIds
    }
    function _processVmsProtection(job: XoBackupJob, isProtected: boolean) {
      if (job.type !== BACKUP_TYPE.backup) {
        return
      }

      _extractVmIdsFromBackupJob(job).forEach(vmId => {
        _updateVmProtection(vmId, isProtected)
      })
    }
    function _updateVmProtection(vmId: XoVm['id'], isProtected: boolean) {
      if (vmIdsProtected.has(vmId) || !xoApp.hasObject(vmId, 'VM')) {
        return
      }

      const vm = restApi.getObject<XoVm>(vmId, 'VM')
      if (vmContainsNoBakTag(vm)) {
        return
      }

      if (isProtected) {
        vmIdsProtected.add(vmId)
        vmIdsUnprotected.delete(vmId)
      } else {
        vmIdsUnprotected.add(vmId)
      }
    }
    async function _jobHasAtLeastOneScheduleEnabled(job: XoBackupJob) {
      for (const maybeScheduleId in job.settings) {
        if (maybeScheduleId === '') {
          continue
        }

        try {
          const schedule = await xoApp.getSchedule(maybeScheduleId as XoSchedule['id'])
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

    const backupsResult = await getFromAsyncCache<DashboardAsyncCache['backups']>(
      this.#dashboardAsyncCache as Map<'backups', AsyncCacheEntry<DashboardAsyncCache['backups']>>,
      'backups',
      async () => {
        const [logs, jobs] = await Promise.all([
          xoApp.getBackupNgLogsSorted({
            filter: log => log.message === 'backup' || log.message === 'metadata',
          }),
          Promise.all([
            xoApp.getAllJobs('backup'),
            xoApp.getAllJobs('mirrorBackup'),
            xoApp.getAllJobs('metadataBackup'),
          ]).then(jobs => jobs.flat(1)) as Promise<XoBackupJob[]>,
        ])
        const logsByJob = groupBy(logs, 'jobId')

        let disabledJobs = 0
        let failedJobs = 0
        let skippedJobs = 0
        let successfulJobs = 0
        const backupJobIssues: DashboardBackupsInfo['issues'] = []

        for (const job of jobs) {
          if (!(await _jobHasAtLeastOneScheduleEnabled(job))) {
            _processVmsProtection(job, false)
            disabledJobs++
            continue
          }

          // Get only the last 3 runs
          const jobLogs = logsByJob[job.id]?.slice(-3).reverse()
          if (jobLogs === undefined || jobLogs.length === 0) {
            _processVmsProtection(job, false)
            continue
          }

          if (job.type === BACKUP_TYPE.backup) {
            const lastJobLog = jobLogs[0]
            const { tasks, status } = lastJobLog

            if (tasks === undefined) {
              _processVmsProtection(job, status === 'success')
            } else {
              // @TODO: remove as when logs are correctly typed
              ;(tasks as unknown as { data: { id: XoVm['id'] }; status: string }[]).forEach(task => {
                _updateVmProtection(task.data.id, task.status === 'success')
              })
            }
          }

          const failedLog = jobLogs.find(log => log.status !== 'success')
          if (failedLog !== undefined) {
            const { status } = failedLog
            if (status === 'failure' || status === 'interrupted') {
              failedJobs++
            } else if (status === 'skipped') {
              skippedJobs++
            }
            backupJobIssues.push({
              // @TODO: remove as when logs are correctly typed
              logs: jobLogs.map(log => log.status) as DashboardBackupsInfo['issues'][number]['logs'],
              name: job.name,
              type: job.type,
              uuid: job.id,
            })
          } else {
            successfulJobs++
          }
        }

        const nVmsProtected = vmIdsProtected.size
        const nVmsUnprotected = vmIdsUnprotected.size
        const nVmsNotInJob = nonReplicaVms.length - (nVmsProtected + nVmsUnprotected)

        return {
          jobs: {
            disabled: disabledJobs,
            failed: failedJobs,
            skipped: skippedJobs,
            successful: successfulJobs,
            total: jobs.length,
          },
          issues: backupJobIssues,
          vmsProtection: {
            protected: nVmsProtected,
            unprotected: nVmsUnprotected,
            notInJob: nVmsNotInJob,
          },
        }
      },
      this.#dashboardCacheOpts
    )

    if (backupsResult?.value !== undefined) {
      return { ...backupsResult.value, isExpired: backupsResult.isExpired }
    }
  }

  #getHostsStatus(): XoaDashboard['hostsStatus'] {
    const hosts = this.#restApi.getObjectsByType<XoHost>('host')
    let nRunning = 0
    let nHalted = 0
    let nUnknown = 0
    let total = 0
    for (const id in hosts) {
      total++
      const host = hosts[id as XoHost['id']]
      switch (host.power_state) {
        case HOST_POWER_STATE.RUNNING:
          nRunning++
          break
        case HOST_POWER_STATE.HALTED:
          nHalted++
          break
        default:
          nUnknown++
          break
      }
    }

    return {
      running: nRunning,
      halted: nHalted,
      unknown: nUnknown,
      total,
    }
  }

  #getVmsStatus(): XoaDashboard['vmsStatus'] {
    const vms = this.#restApi.getObjectsByType<XoVm>('VM')
    let nActive = 0
    let nInactive = 0
    let nUnknown = 0
    let total = 0
    for (const id in vms) {
      total++
      const vm = vms[id as XoVm['id']]
      switch (vm.power_state) {
        case VM_POWER_STATE.RUNNING:
        case VM_POWER_STATE.PAUSED:
          nActive++
          break
        case VM_POWER_STATE.HALTED:
        case VM_POWER_STATE.SUSPENDED:
          nInactive++
          break
        default:
          nUnknown++
          break
      }
    }

    return {
      active: nActive,
      inactive: nInactive,
      unknown: nUnknown,
      total,
    }
  }

  async getDashboard({ stream }: { stream?: Writable } = {}): Promise<XoaDashboard> {
    async function promiseWriteInStream<T>(maybePromise: Promise<T> | T, key: string): Promise<T> {
      let data: T
      if (isPromise(maybePromise)) {
        data = await maybePromise
      } else {
        data = maybePromise
      }

      if (stream !== undefined) {
        if (stream.writableNeedDrain) {
          await new Promise(resolve => stream.once('drain', resolve))
        }

        stream.write(JSON.stringify({ [key]: data }) + '\n')
      }

      return data
    }

    const [
      nPools,
      nHosts,
      hostsStatus,
      resourcesOverview,
      vmsStatus,
      storageRepositories,
      poolsStatus,
      missingPatches,
      backupRepositories,
      nHostsEol,
      backups,
    ] = await Promise.all([
      promiseWriteInStream(this.#getNumberOfPools(), 'nPools'),
      promiseWriteInStream(this.#getNumberOfHosts(), 'nHosts'),
      promiseWriteInStream(this.#getHostsStatus(), 'hostsStatus'),
      promiseWriteInStream(this.#getResourcesOverview(), 'resourcesOverview'),
      promiseWriteInStream(this.#getVmsStatus(), 'vmsStatus'),
      promiseWriteInStream(this.#getStorageRepositoriesSizeInfo(), 'storageRepositories'),
      promiseWriteInStream(this.#getPoolsStatus(), 'poolsStatus'),
      promiseWriteInStream(this.#getMissingPatchesInfo(), 'missingPatches'),
      promiseWriteInStream(
        this.#getBackupRepositoriesSizeInfo().catch(err => {
          log.error('#getBackupRepositoriesSizeInfo failed', err)
          // explicitly return undefined because typescript understand it as void instead of undefined
          return undefined
        }),
        'backupRepositories'
      ),
      promiseWriteInStream(
        this.#getNumberOfEolHosts().catch(err => {
          log.error('#getNumberOfEolHosts failed', err)
          return undefined
        }),
        'nHostsEol'
      ),
      promiseWriteInStream(
        this.#getbackupsInfo().catch(err => {
          log.error('#getbackupsInfo failed', err)
          return undefined
        }),
        'backups'
      ),
    ])

    return {
      nPools,
      nHosts,
      backupRepositories,
      resourcesOverview,
      poolsStatus,
      nHostsEol,
      missingPatches,
      storageRepositories,
      backups,
      hostsStatus,
      vmsStatus,
    }
  }
}
