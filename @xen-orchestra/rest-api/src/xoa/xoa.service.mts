import groupBy from 'lodash/groupBy.js'
import { featureUnauthorized } from 'xo-common/api-errors.js'
import semver from 'semver'
import {
  AnyXoVdi,
  AnyXoVm,
  BACKUP_TYPE,
  XoVmBackupJob,
  XoHost,
  XoPool,
  XoSr,
  XoVbd,
  XoVm,
  XoBackupLog,
} from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { createPredicate } from 'value-matcher'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { noSuchObject } from 'xo-common/api-errors.js'
import { parse } from 'xo-remote-parser'
import { Writable } from 'node:stream'

import { type AsyncCacheEntry, getFromAsyncCache } from '../helpers/cache.helper.mjs'
import { DashboardBackupRepositoriesSizeInfo, DashboardBackupsInfo, SrSizeInfo, XoaDashboard } from './xoa.type.mjs'
import { isReplicaVm, isSrWritableOrIso, promiseWriteInStream, vmContainsNoBakTag } from '../helpers/utils.helper.mjs'
import type { IsEmptyData, MaybePromise } from '../helpers/helper.type.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { HostService } from '../hosts/host.service.mjs'
import type { HasNoAuthorization } from '../rest-api/rest-api.type.mjs'
import { BackupLogService } from '../backup-logs/backup-log.service.mjs'
import { VmService } from '../vms/vm.service.mjs'
import { BackupJobService } from '../backup-jobs/backup-job.service.mjs'

const log = createLogger('xo:rest-api:xoa-service')

type DashboardAsyncCache = {
  backupRepositories: MaybePromise<DashboardBackupRepositoriesSizeInfo | IsEmptyData | undefined>
  backups: MaybePromise<DashboardBackupsInfo | IsEmptyData>
}

export class XoaService {
  #restApi: RestApi
  #hostService: HostService
  #dashboardAsyncCache = new Map<
    keyof DashboardAsyncCache,
    AsyncCacheEntry<DashboardAsyncCache[keyof DashboardAsyncCache]>
  >()
  #dashboardCacheOpts: { timeout?: number; expiresIn?: number }
  #backupLogService: BackupLogService
  #vmService: VmService
  #backupJobService: BackupJobService

  constructor(restApi: RestApi) {
    this.#restApi = restApi
    this.#hostService = restApi.ioc.get(HostService)
    this.#dashboardCacheOpts = {
      timeout: this.#restApi.xoApp.config.getOptionalDuration('rest-api.dashboardCacheTimeout') ?? 60000,
      expiresIn: this.#restApi.xoApp.config.getOptionalDuration('rest-api.dashboardCacheExpiresIn'),
    }
    this.#backupLogService = this.#restApi.ioc.get(BackupLogService)
    this.#vmService = this.#restApi.ioc.get(VmService)
    this.#backupJobService = this.#restApi.ioc.get(BackupJobService)
  }

  async #getBackupRepositoriesSizeInfo(): Promise<
    (DashboardBackupRepositoriesSizeInfo & { isExpired?: true }) | (IsEmptyData & { isExpired?: true }) | undefined
  > {
    const brResult = await getFromAsyncCache<DashboardAsyncCache['backupRepositories']>(
      this.#dashboardAsyncCache as Map<
        'backupRepositories',
        AsyncCacheEntry<DashboardAsyncCache['backupRepositories']>
      >,
      'backupRepositories',
      async () => {
        const xoApp = this.#restApi.xoApp

        let s3Brsize: { size: { backups: number } } | undefined
        let otherBrSize:
          | {
              size: { available?: number; backups: number; other?: number; total?: number; used?: number }
            }
          | undefined

        const backupRepositories = await xoApp.getAllRemotes()
        if (backupRepositories.length === 0) {
          return { isEmpty: true }
        }

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

          if (isS3) {
            if (s3Brsize === undefined) {
              s3Brsize = { size: { backups: 0 } }
            }
            s3Brsize.size.backups += totalBackupSize.onDisk
          } else {
            if (otherBrSize === undefined) {
              otherBrSize = {
                size: {
                  backups: 0,
                  available: undefined,
                  other: undefined,
                  total: undefined,
                  used: undefined,
                },
              }
            }
            if (available === undefined || size === undefined || used === undefined) {
              log.info('#getBackupRepositoriesSizeInfo missing info for BR:', backupRepository.id)
            }

            otherBrSize.size.backups += totalBackupSize.onDisk
            if (available !== undefined) {
              otherBrSize.size.available = (otherBrSize.size.available ?? 0) + available
            }
            if (used !== undefined) {
              otherBrSize.size.used = (otherBrSize.size.used ?? 0) + used
              otherBrSize.size.other = (otherBrSize.size.other ?? 0) + (used - totalBackupSize.onDisk)
            }
            if (size !== undefined) {
              otherBrSize.size.total = (otherBrSize.size.total ?? 0) + size
            }
          }
        }

        // if only disabled BR
        if (otherBrSize === undefined && s3Brsize === undefined) {
          return { isEmpty: true }
        }

        const result: DashboardBackupRepositoriesSizeInfo = {}
        if (s3Brsize !== undefined) {
          result.s3 = s3Brsize
        }
        if (otherBrSize !== undefined) {
          result.other = otherBrSize
        }

        return result
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
    const srs = Object.values(
      this.#restApi.getObjectsByType<XoSr>('SR', {
        filter: isSrWritableOrIso,
      })
    )

    if (pools === undefined && hosts === undefined && srs === undefined) {
      return { isEmpty: true }
    }

    const maxLenght = Math.max(hosts.length, srs.length)

    const resourcesOverview = { nCpus: 0, memorySize: 0, srSize: 0 }
    for (let index = 0; index < maxLenght; index++) {
      const pool = pools[index]
      const host = hosts[index]
      const sr = srs[index]

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
    let nDisconnectedServers = 0

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
        nDisconnectedServers++
        return
      }

      nUnknownServers++
    })

    return {
      connected: nConnectedServers,
      disconnected: nDisconnectedServers,
      unreachable: nUnreachableServers,
      unknown: nUnknownServers,
      total: servers.length,
    }
  }

  async #getNumberOfEolHosts(): Promise<number | IsEmptyData> {
    const getHVSupportedVersions = this.#restApi.xoApp.getHVSupportedVersions

    if (getHVSupportedVersions === undefined) {
      return { isEmpty: true }
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

  /**
   * Throw if no authorization
   */
  async #getMissingPatchesInfo(): Promise<XoaDashboard['missingPatches']> {
    const missingPatchesInfo = await this.#hostService.getMissingPatchesInfo()
    const eolHosts = await this.#getNumberOfEolHosts()

    const { hasAuthorization, nHostsFailed, nHostsWithMissingPatches, nPoolsWithMissingPatches } = missingPatchesInfo

    return {
      hasAuthorization,
      nHosts: this.#getNumberOfHosts(),
      nHostsFailed,
      nHostsWithMissingPatches,
      nHostsEol: eolHosts,
      nPools: this.#getNumberOfPools(),
      nPoolsWithMissingPatches,
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

  #getStorageRepositoriesSizeInfo(): SrSizeInfo | IsEmptyData {
    const writableSrs = this.#restApi.getObjectsByType<XoSr>('SR', {
      filter: isSrWritableOrIso,
    })

    const srs = Object.values(writableSrs)

    if (srs.length === 0) {
      return { isEmpty: true }
    }

    let replicated = 0
    let total = 0
    let used = 0

    for (const sr of srs) {
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

  async #getbackupsInfo(): Promise<
    (DashboardBackupsInfo & { isExpired?: true }) | (IsEmptyData & { isExpired?: true }) | undefined
  > {
    const vmIdsProtected = new Set<XoVm['id']>()
    const vmIdsUnprotected = new Set<XoVm['id']>()
    const nonReplicaVms = Object.values(this.#restApi.getObjectsByType<XoVm>('VM', { filter: vm => !isReplicaVm(vm) }))
    const restApi = this.#restApi
    const xoApp = restApi.xoApp
    function _extractVmIdsFromBackupJob(job: XoVmBackupJob) {
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
    function _processVmsProtection(job: XoVmBackupJob, isProtected: boolean) {
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

    const backupsResult = await getFromAsyncCache<DashboardAsyncCache['backups']>(
      this.#dashboardAsyncCache as Map<'backups', AsyncCacheEntry<DashboardAsyncCache['backups']>>,
      'backups',
      async () => {
        const [logs, jobs] = await Promise.all([
          xoApp.getBackupNgLogsSorted({
            filter: log => this.#backupLogService.isBackupLog(log),
          }) as Promise<XoBackupLog[]>,
          Promise.all([
            xoApp.getAllJobs('backup'),
            xoApp.getAllJobs('mirrorBackup'),
            xoApp.getAllJobs('metadataBackup'),
          ]).then(jobs => jobs.flat(1)) as Promise<XoVmBackupJob[]>,
        ])

        if (jobs.length === 0) {
          return { isEmpty: true }
        }

        const logsByJob = groupBy(logs, 'jobId')

        let disabledJobs = 0
        let failedJobs = 0
        let skippedJobs = 0
        let successfulJobs = 0
        let noRecentRun = 0
        const backupJobIssues: DashboardBackupsInfo['issues'] = []

        const now = new Date()
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(now.getDate() - 7)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        for (const job of jobs) {
          if (!(await this.#backupJobService.backupJobHasAtLeastOneScheduleEnabled(job.id))) {
            _processVmsProtection(job, false)
            disabledJobs++
            continue
          }

          type NonPendingXoBackupLog = XoBackupLog & {
            status: 'success' | 'failure' | 'skipped' | 'interrupted'
          }
          const last3BackupLogs: NonPendingXoBackupLog[] = []
          const backupLogsOfTheWeek: NonPendingXoBackupLog[] = []
          logsByJob[job.id]?.reverse().forEach(log => {
            if (log.status === 'pending') {
              return
            }
            const nonPendingLog = log as NonPendingXoBackupLog

            if (last3BackupLogs.length < 3) {
              last3BackupLogs.push(nonPendingLog)
            }

            if (log.start > sevenDaysAgo.getTime()) {
              backupLogsOfTheWeek.push(nonPendingLog)
            }
          })

          if (backupLogsOfTheWeek.length === 0) {
            noRecentRun++
          } else {
            let hasSoftFailure = false
            let hasHardFailure = false

            for (const log of backupLogsOfTheWeek) {
              if (log.status === 'interrupted' || log.status === 'failure') {
                hasHardFailure = true
                break
              }

              if (log.status === 'skipped') {
                hasSoftFailure = true
              }
            }

            if (hasHardFailure) {
              failedJobs++
            } else if (hasSoftFailure) {
              skippedJobs++
            } else {
              successfulJobs++
            }
          }

          if (last3BackupLogs.length === 0) {
            _processVmsProtection(job, false)
            continue
          }

          if (job.type === BACKUP_TYPE.backup) {
            // VM should only be considered protected if these last logs have been successful
            const backupLogStatusesByVm: Record<XoVm['id'], boolean[]> = {}
            function updateVmBackupLogStatuses(id: XoVm['id'], isSuccess: boolean) {
              if (backupLogStatusesByVm[id] === undefined) {
                backupLogStatusesByVm[id] = []
              }
              backupLogStatusesByVm[id].push(isSuccess)
            }

            last3BackupLogs.forEach(jobLob => {
              const { tasks, status } = jobLob
              if (tasks === undefined) {
                const vmIds = _extractVmIdsFromBackupJob(job)
                vmIds.forEach(vmId => updateVmBackupLogStatuses(vmId, status === 'success'))
              } else {
                tasks.forEach(task => {
                  if (task.data === undefined) {
                    return
                  }
                  updateVmBackupLogStatuses(task.data.id as XoVm['id'], task.status === 'success')
                })
              }
            })

            for (const [vmId, statuses] of Object.entries(backupLogStatusesByVm)) {
              _updateVmProtection(
                vmId as XoVm['id'],
                statuses.every(status => status)
              )
            }
          }

          const failedLog = last3BackupLogs.find(log => log.status !== 'success')
          if (failedLog !== undefined) {
            backupJobIssues.push({
              logs: last3BackupLogs.map(log => log.status),
              name: job.name,
              type: job.type,
              uuid: job.id,
            })
          }
        }

        const nVmsProtected = vmIdsProtected.size
        const nVmsUnprotected = vmIdsUnprotected.size
        const nVmsNotInJob = nonReplicaVms.length - (nVmsProtected + nVmsUnprotected)

        return {
          jobs: {
            disabled: disabledJobs,
            failed: failedJobs,
            noRecentRun,
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
    const { disabled, running, halted, total, unknown } = this.#hostService.getHostsStatus()

    return {
      disabled,
      running,
      halted,
      unknown,
      total,
    }
  }

  #getVmsStatus(): XoaDashboard['vmsStatus'] {
    return this.#vmService.getVmsStatus()
  }

  async getDashboard({ stream }: { stream?: Writable } = {}): Promise<XoaDashboard> {
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
      backups,
    ] = await Promise.all([
      promiseWriteInStream({ maybePromise: this.#getNumberOfPools(), path: 'nPools', stream }),
      promiseWriteInStream({ maybePromise: this.#getNumberOfHosts(), path: 'nHosts', stream }),
      promiseWriteInStream({ maybePromise: this.#getHostsStatus(), path: 'hostsStatus', stream }),
      promiseWriteInStream({ maybePromise: this.#getResourcesOverview(), path: 'resourcesOverview', stream }),
      promiseWriteInStream({ maybePromise: this.#getVmsStatus(), path: 'vmsStatus', stream }),
      promiseWriteInStream({
        maybePromise: this.#getStorageRepositoriesSizeInfo(),
        path: 'storageRepositories',
        stream,
        handleError: true,
      }),
      promiseWriteInStream({ maybePromise: this.#getPoolsStatus(), path: 'poolsStatus', stream }),
      promiseWriteInStream({
        maybePromise: this.#getMissingPatchesInfo().catch(err => {
          if (featureUnauthorized.is(err)) {
            return { hasAuthorization: false } as HasNoAuthorization
          }

          throw err
        }),
        path: 'missingPatches',
        stream,
        handleError: true,
      }),
      promiseWriteInStream({
        maybePromise: this.#getBackupRepositoriesSizeInfo(),
        path: 'backupRepositories',
        stream,
        handleError: true,
      }),
      promiseWriteInStream({
        maybePromise: this.#getbackupsInfo(),
        path: 'backups',
        stream,
        handleError: true,
      }),
    ])

    return {
      nPools,
      nHosts,
      backupRepositories,
      resourcesOverview,
      poolsStatus,
      missingPatches,
      storageRepositories,
      backups,
      hostsStatus,
      vmsStatus,
    }
  }
}
