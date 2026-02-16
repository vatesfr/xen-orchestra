import { createLogger } from '@xen-orchestra/log'
import { featureUnauthorized } from 'xo-common/api-errors.js'
import {
  HOST_POWER_STATE,
  VM_POWER_STATE,
  type XapiVmStats,
  type XoHost,
  type XoSr,
  type XoVm,
  type XoPool,
} from '@vates/types'
import type { Writable } from 'node:stream'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { HostService } from '../hosts/host.service.mjs'
import { VmService } from '../vms/vm.service.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { getTopPerProperty, isSrWritable, promiseWriteInStream } from '../helpers/utils.helper.mjs'
import { type AsyncCacheEntry, getFromAsyncCache } from '../helpers/cache.helper.mjs'
import type { PoolDashboard } from './pool.type.mjs'
import { MissingPatchesInfo } from '../hosts/host.type.mjs'
import type { HasNoAuthorization } from '../rest-api/rest-api.type.mjs'

const log = createLogger('xo:rest-api:pool-service')

type DashboardAsyncCache = {
  vmsTopFiveUsage: PoolDashboard['vms']['topFiveUsage']
}
export class PoolService {
  #restApi: RestApi
  #hostService: HostService
  #vmService: VmService
  #alarmService: AlarmService
  #dashboardAsyncCache = new Map<
    keyof DashboardAsyncCache,
    AsyncCacheEntry<DashboardAsyncCache[keyof DashboardAsyncCache]>
  >()
  #dashboardCacheOpts: { timeout?: number; expiresIn?: number }

  constructor(restApi: RestApi) {
    this.#restApi = restApi
    this.#hostService = this.#restApi.ioc.get(HostService)
    this.#vmService = this.#restApi.ioc.get(VmService)
    this.#alarmService = this.#restApi.ioc.get(AlarmService)
    this.#dashboardCacheOpts = {
      timeout: this.#restApi.xoApp.config.getOptionalDuration('rest-api.dashboardCacheTimeout') ?? 60000,
      expiresIn: this.#restApi.xoApp.config.getOptionalDuration('rest-api.dashboardCacheExpiresIn'),
    }
  }

  #getHostsStatus(poolId: XoPool['id']): PoolDashboard['hosts']['status'] {
    const { running, disabled, halted, total } = this.#hostService.getHostsStatus({
      filter: host => host.$pool === poolId,
    })

    return { running, disabled, halted, total }
  }

  #getVmsStatus(poolId: XoPool['id']): PoolDashboard['vms']['status'] {
    const { running, halted, paused, total, suspended } = this.#vmService.getVmsStatus({
      filter: vm => vm.$pool === poolId,
    })

    return {
      running,
      halted,
      paused,
      total,
      suspended,
    }
  }

  #getAlarms(poolId: XoPool['id']): PoolDashboard['alarms'] {
    const alarms = this.#alarmService.getAlarms({ filter: alarm => alarm.$pool === poolId })
    return Object.keys(alarms)
  }

  /**
   * Throw if no authorization
   */
  async getMissingPatches(
    poolId: XoPool['id']
  ): Promise<Pick<MissingPatchesInfo, 'hasAuthorization' | 'missingPatches'>> {
    const missingPatchesInfo = await this.#hostService.getMissingPatchesInfo({
      filter: host => host.$pool === poolId,
    })

    const { hasAuthorization, missingPatches } = missingPatchesInfo
    return {
      hasAuthorization,
      missingPatches,
    }
  }

  #getTopFiveSrsUsage(poolId: XoPool['id']): PoolDashboard['srs']['topFiveUsage'] {
    const srs = Object.values(
      this.#restApi.getObjectsByType<XoSr>('SR', {
        filter: sr => sr.$pool === poolId && isSrWritable(sr) && sr.SR_type !== 'udev',
      })
    )

    const topFive = getTopPerProperty(
      srs.map(({ name_label, id, physical_usage, size }) => ({
        name_label,
        id,
        percent: (physical_usage / size) * 100,
        physical_usage,
        size,
      })),
      { prop: 'percent', length: 5 }
    )

    return topFive
  }

  #getTopFiveHostsRamUsage(poolId: XoPool['id']): PoolDashboard['hosts']['topFiveUsage']['ram'] {
    const hosts = Object.values(
      this.#restApi.getObjectsByType<XoHost>('host', {
        filter: host => host.$pool === poolId && host.power_state === HOST_POWER_STATE.RUNNING,
      })
    )

    const topFive = getTopPerProperty(
      hosts.map(({ name_label, id, memory: { size, usage } }) => ({
        name_label,
        id,
        size,
        usage,
        percent: (usage / size) * 100,
      })),
      { length: 5, prop: 'percent' }
    )

    return topFive
  }

  #getVmWithLastRamInfo(
    vm: XoVm,
    stats: XapiVmStats
  ): XoVm & { memoryStats: { memory: number; memoryFree: number; usage: number } } {
    const memory = stats.stats.memory?.pop() ?? 0
    const memoryFree = stats.stats.memoryFree?.pop() ?? 0
    const usage = memory - memoryFree

    return { ...vm, memoryStats: { memory, memoryFree, usage } }
  }

  #getVmWithLastCpuInfo(vm: XoVm, stats: XapiVmStats): XoVm & { usage: number } {
    const cpusStats = Object.values(stats.stats.cpus ?? {})
    const usage =
      cpusStats.reduce((total, cpuStats, index) => {
        const lastCpuStat = cpuStats.pop()
        if (lastCpuStat == null) {
          log.warn(`cpu#${index} is null. vm:`, vm.id)
        }
        total += lastCpuStat ?? 0
        return total
      }, 0) / cpusStats.length

    return { ...vm, usage }
  }

  async #getTopFiveVmsRamCpuUsage(poolId: XoPool['id']): Promise<DashboardAsyncCache['vmsTopFiveUsage']> {
    const vmsUsageResult = await getFromAsyncCache<DashboardAsyncCache['vmsTopFiveUsage']>(
      this.#dashboardAsyncCache,
      'vmsRamCpuUsage',
      async () => {
        const vms = this.#restApi.getObjectsByType<XoVm>('VM', {
          filter: vm =>
            vm.$pool === poolId &&
            (vm.power_state === VM_POWER_STATE.RUNNING || vm.power_state === VM_POWER_STATE.PAUSED),
        })

        const vmsWithRamInfo: (Pick<XoVm, 'id' | 'name_label'> & {
          percent: number
          memory: number
          memoryFree: number
        })[] = []
        const vmsWithCpuInfo: (Pick<XoVm, 'id' | 'name_label'> & {
          percent: number
        })[] = []
        for (const id in vms) {
          const vm = vms[id as XoVm['id']]
          const stats = await this.#restApi.xoApp.getXapiVmStats(vm.id)
          if (vm.managementAgentDetected) {
            const {
              memoryStats: { memory, memoryFree, usage },
            } = this.#getVmWithLastRamInfo(vm, stats)
            vmsWithRamInfo.push({
              id: vm.id,
              name_label: vm.name_label,
              memory,
              memoryFree,
              percent: (usage / memory) * 100,
            })
          }

          const { usage: cpuUsage } = this.#getVmWithLastCpuInfo(vm, stats)
          vmsWithCpuInfo.push({ id: vm.id, name_label: vm.name_label, percent: cpuUsage })
        }

        const topFiveRamUsage = getTopPerProperty(vmsWithRamInfo, { prop: 'percent', length: 5 })
        const topFiveCpuUsage = getTopPerProperty(vmsWithCpuInfo, { prop: 'percent', length: 5 })

        return {
          ram: topFiveRamUsage,
          cpu: topFiveCpuUsage,
        }
      },
      this.#dashboardCacheOpts
    )

    if (vmsUsageResult?.value !== undefined) {
      return { ...vmsUsageResult.value, isExpired: vmsUsageResult.isExpired }
    }
  }

  async #getTopFiveHostsCpuUsage(poolId: XoPool['id']): Promise<PoolDashboard['hosts']['topFiveUsage']['cpu']> {
    const hosts = this.#restApi.getObjectsByType<XoHost>('host', {
      filter: host => host.$pool === poolId && host.power_state === HOST_POWER_STATE.RUNNING,
    })

    const hostsWithPercent: (Pick<XoHost, 'id' | 'name_label'> & { percent: number })[] = []
    for (const id in hosts) {
      const host = hosts[id as XoHost['id']]
      const stats = await this.#restApi.xoApp.getXapiHostStats(host.id, 'seconds')
      const cpusStats = Object.values(stats.stats.cpus ?? {})
      const percent =
        cpusStats.reduce((total, cpuStats, index) => {
          const lastCpuStat = cpuStats.pop()
          if (lastCpuStat == null) {
            log.warn(`cpu#${index} is null. host:`, host.id)
          }
          total += lastCpuStat ?? 0
          return total
        }, 0) / cpusStats.length

      hostsWithPercent.push({ percent, id: host.id, name_label: host.name_label })
    }

    const topFive = getTopPerProperty(hostsWithPercent, { prop: 'percent', length: 5 })
    return topFive
  }

  #getCpuProvisioning(poolId: XoPool['id']): PoolDashboard['cpuProvisioning'] {
    const pool = this.#restApi.getObject<XoPool>(poolId, 'pool')

    const vms = this.#restApi.getObjectsByType<XoVm>('VM', {
      filter: vm => vm.$pool === poolId && vm.power_state === VM_POWER_STATE.RUNNING,
    })

    let assignedVcpu = 0
    for (const id in vms) {
      const vm = vms[id as XoVm['id']]
      assignedVcpu += vm.CPUs.number
    }

    const total = pool.cpus.cores ?? 0
    const percent = total === 0 ? 0 : (assignedVcpu * 100) / total

    return {
      total,
      assigned: assignedVcpu,
      percent,
    }
  }

  async getDashboard(id: XoPool['id'], { stream }: { stream?: Writable } = {}): Promise<PoolDashboard> {
    const [
      hostStatus,
      vmsStatus,
      alarms,
      missingPatches,
      storageUsage,
      hostsRamUsage,
      hostsCpuUsage,
      cpuProvisioning,
      vmsUsage,
    ] = await Promise.all([
      promiseWriteInStream({ maybePromise: this.#getHostsStatus(id), path: 'hosts.status', stream }),
      promiseWriteInStream({ maybePromise: this.#getVmsStatus(id), path: 'vms.status', stream }),
      promiseWriteInStream({ maybePromise: this.#getAlarms(id), path: 'alarms', stream }),
      promiseWriteInStream({
        maybePromise: this.getMissingPatches(id).catch(err => {
          if (featureUnauthorized.is(err)) {
            return { hasAuthorization: false } as HasNoAuthorization
          }

          throw err
        }),
        path: 'hosts.missingPatches',
        stream,
      }),
      promiseWriteInStream({ maybePromise: this.#getTopFiveSrsUsage(id), path: 'srs.topFiveUsage', stream }),
      promiseWriteInStream({ maybePromise: this.#getTopFiveHostsRamUsage(id), path: 'hosts.topFiveUsage.ram', stream }),
      promiseWriteInStream({ maybePromise: this.#getTopFiveHostsCpuUsage(id), path: 'hosts.topFiveUsage.cpu', stream }),
      promiseWriteInStream({ maybePromise: this.#getCpuProvisioning(id), path: 'cpuProvisioning', stream }),
      promiseWriteInStream({ maybePromise: this.#getTopFiveVmsRamCpuUsage(id), path: 'vms.topFiveUsage', stream }),
    ])

    return {
      hosts: {
        status: hostStatus,
        topFiveUsage: {
          ram: hostsRamUsage,
          cpu: hostsCpuUsage,
        },
        missingPatches,
      },
      vms: {
        status: vmsStatus,
        topFiveUsage: vmsUsage,
      },
      srs: {
        topFiveUsage: storageUsage,
      },
      alarms,
      cpuProvisioning,
    }
  }
}
