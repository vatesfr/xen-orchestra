import { inspect } from 'node:util'
import { createLogger } from '@xen-orchestra/log'
import type { Xapi, XapiStatsGranularity, XoApp, XoHost, XoPool, XoVm } from '@vates/types'

import type {
  AveragesMap,
  GlobalOptions,
  HostStatsAveragesResult,
  MigrateOtherVmsResult,
  PerformanceSubmode,
  PlanOptions,
  ProposedMigration,
  TaggedHost,
  TaggedHostsResult,
  Thresholds,
  VcpuHost,
} from './types.mjs'

const log = createLogger('xo:load-balancer-ng')

// ===================================================================
// Constants
// ===================================================================

export const EXECUTION_DELAY = 1 // minutes between plan executions

const MINUTES_OF_HISTORICAL_DATA = 30

export const DEFAULT_CRITICAL_THRESHOLD_CPU = 90.0 // percent
export const DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE = 1000.0 // MB

// Threshold derivation factors
const HIGH_THRESHOLD_CPU_FACTOR = 0.85
const LOW_THRESHOLD_CPU_FACTOR = 0.65
const HIGH_THRESHOLD_MEMORY_FREE_FACTOR = 1.2
const LOW_THRESHOLD_MEMORY_FREE_FACTOR = 1.5

// vCPU prepositioning constants
const THRESHOLD_VCPU_RATIO = 0.9
const VCPU_NUMBER_TOLERANCE = 1
const THRESHOLD_POOL_CPU_PERCENT = 40

// ===================================================================
// Concurrency semaphore (replaces limit-concurrency-decorator)
// ===================================================================

export class Semaphore {
  readonly #limit: number
  #running = 0
  readonly #queue: Array<() => void> = []

  constructor(limit: number) {
    this.#limit = limit
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.#running >= this.#limit) {
      await new Promise<void>(resolve => this.#queue.push(resolve))
    }
    this.#running++
    try {
      return await task()
    } finally {
      this.#running--
      this.#queue.shift()?.()
    }
  }
}

// ===================================================================
// Statistics helpers
// ===================================================================

function computeAverage(values: (number | null)[] | undefined, nPoints?: number): number {
  if (values === undefined || values.length === 0) {
    return 0
  }

  const startIndex = nPoints !== undefined ? Math.max(0, values.length - nPoints) : 0
  let sum = 0
  let count = 0

  for (let i = startIndex; i < values.length; i++) {
    const value = values[i]
    if (value !== null && value !== undefined) {
      sum += value
      count++
    }
  }

  return count === 0 ? 0 : sum / count
}

function computeResourcesAverage(
  objects: Array<{ id: string }>,
  statsMap: Record<
    string,
    { stats: { cpus?: Record<string, (number | null)[]>; memory?: (number | null)[]; memoryFree?: (number | null)[] } }
  >,
  nPoints: number
): AveragesMap {
  const averages: AveragesMap = {}

  for (const object of objects) {
    const objectStats = statsMap[object.id]
    if (objectStats === undefined) {
      continue
    }
    const { stats } = objectStats
    const cpuValues =
      stats.cpus !== undefined ? Object.values(stats.cpus).map(cpuSeries => computeAverage(cpuSeries, nPoints)) : []

    averages[object.id] = {
      cpu: cpuValues.length > 0 ? cpuValues.reduce((sum, v) => sum + v, 0) / cpuValues.length : 0,
      nCpus: cpuValues.length,
      memoryFree: computeAverage(stats.memoryFree, nPoints),
      memory: computeAverage(stats.memory, nPoints),
    }
  }

  return averages
}

function computeResourcesAverageWithWeight(
  recentAverages: AveragesMap,
  historicalAverages: AveragesMap,
  recentWeight: number
): AveragesMap {
  const combined: AveragesMap = {}

  for (const id in recentAverages) {
    const recent = recentAverages[id]
    const historical = historicalAverages[id]
    if (recent === undefined || historical === undefined) {
      continue
    }

    const historicalWeight = 1 - recentWeight
    combined[id] = {
      cpu: recent.cpu * recentWeight + historical.cpu * historicalWeight,
      nCpus: recent.nCpus,
      memoryFree: recent.memoryFree * recentWeight + historical.memoryFree * historicalWeight,
      memory: recent.memory * recentWeight + historical.memory * historicalWeight,
    }
  }

  return combined
}

function computeWeightedPoolAverageCpu(hostsAverages: AveragesMap): number {
  const hostAveragesList = Object.values(hostsAverages)
  const totalCpus = hostAveragesList.reduce((sum, host) => sum + host.nCpus, 0)
  if (totalCpus === 0) {
    return 0
  }
  return hostAveragesList.reduce((sum, host) => sum + host.cpu * host.nCpus, 0) / totalCpus
}

function setRealCpuAverageOfVms(vms: XoVm[], vmsAverages: AveragesMap, physicalCpuCount: number): void {
  for (const vm of vms) {
    const averages = vmsAverages[vm.id]
    if (averages !== undefined && physicalCpuCount > 0) {
      averages.cpu *= averages.nCpus / physicalCpuCount
    }
  }
}

function vcpuPerCpuRatio(host: VcpuHost): number {
  return host.cpuCount > 0 ? host.vcpuCount / host.cpuCount : 0
}

function numberOrDefault(value: number | undefined | null, defaultValue: number): number {
  return value != null && value >= 0 ? value : defaultValue
}

// ===================================================================
// Abstract base class for all load balancer plans
// ===================================================================

export default abstract class Plan {
  protected readonly _xo: XoApp
  readonly _name: string
  readonly _poolIds: string[]
  readonly _excludedHosts: XoHost['id'][]
  readonly _thresholds: Thresholds
  readonly _affinityTags: string[]
  readonly _antiAffinityTags: string[]
  readonly _performanceSubmode: PerformanceSubmode
  protected readonly _globalOptions: GlobalOptions
  protected readonly _semaphore: Semaphore
  /** Populated during dry-run execution */
  readonly _proposedMigrations: ProposedMigration[] = []

  constructor(
    xo: XoApp,
    name: string,
    poolIds: string[],
    { excludedHosts = [], thresholds, balanceVcpus, affinityTags = [], antiAffinityTags = [] }: PlanOptions,
    globalOptions: GlobalOptions,
    semaphore: Semaphore
  ) {
    this._xo = xo
    this._name = name
    this._poolIds = poolIds
    this._excludedHosts = excludedHosts
    this._affinityTags = affinityTags
    this._antiAffinityTags = antiAffinityTags
    this._performanceSubmode =
      balanceVcpus === false || balanceVcpus === undefined
        ? 'conservative'
        : balanceVcpus === true
          ? 'vCpuPrepositioning'
          : 'preventive'
    this._globalOptions = globalOptions
    this._semaphore = semaphore

    const cpuCritical = numberOrDefault(thresholds?.cpu, DEFAULT_CRITICAL_THRESHOLD_CPU)
    const memFreeCritical =
      numberOrDefault(thresholds?.memoryFree, DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE) * 1024 * 1024

    this._thresholds = {
      cpu: {
        critical: cpuCritical,
        high: cpuCritical * HIGH_THRESHOLD_CPU_FACTOR,
        low: cpuCritical * LOW_THRESHOLD_CPU_FACTOR,
      },
      memoryFree: {
        critical: memFreeCritical,
        high: memFreeCritical * HIGH_THRESHOLD_MEMORY_FREE_FACTOR,
        low: memFreeCritical * LOW_THRESHOLD_MEMORY_FREE_FACTOR,
      },
    }
  }

  abstract execute(): Promise<void>

  // ===================================================================
  // Object accessors
  // ===================================================================

  protected _getPlanPools(): Record<XoPool['id'], XoPool> {
    const pools: Record<string, XoPool> = {}

    try {
      for (const poolId of this._poolIds) {
        pools[poolId] = this._xo.getObject<XoPool>(poolId as XoPool['id'], 'pool')
      }
    } catch (error) {
      log.warn('Failed to retrieve one or more pools', { error, poolIds: this._poolIds })
      return {}
    }

    return pools
  }

  protected _getHosts({ powerState = 'Running' }: { powerState?: string } = {}): XoHost[] {
    return Object.values(this._xo.getObjects()).filter(
      (obj): obj is XoHost =>
        obj.type === 'host' &&
        this._poolIds.includes(obj.$poolId) &&
        obj.power_state === powerState &&
        !this._excludedHosts.includes(obj.id)
    )
  }

  protected _getAllRunningVms(): XoVm[] {
    return Object.values(this._xo.getObjects()).filter(
      (obj): obj is XoVm =>
        obj.type === 'VM' &&
        obj.power_state === 'Running' &&
        !obj.tags.some(tag => this._globalOptions.ignoredVmTags.has(tag))
    )
  }

  // ===================================================================
  // Statistics collection (Promise.allSettled — failed hosts are skipped)
  // ===================================================================

  protected async _getHostsStats(
    hosts: XoHost[],
    granularity: XapiStatsGranularity
  ): Promise<
    Record<
      string,
      {
        stats: { cpus?: Record<string, (number | null)[]>; memory?: (number | null)[]; memoryFree?: (number | null)[] }
      }
    >
  > {
    const statsMap: Record<
      string,
      {
        stats: { cpus?: Record<string, (number | null)[]>; memory?: (number | null)[]; memoryFree?: (number | null)[] }
      }
    > = {}

    const results = await Promise.allSettled(
      hosts.map(host =>
        this._xo.getXapiHostStats(host.id, granularity).then(hostStats => {
          statsMap[host.id] = { stats: hostStats.stats }
        })
      )
    )

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const host = hosts[index]
        log.warn('Failed to fetch stats for host — skipping', {
          hostId: host?.id,
          error: result.reason,
        })
      }
    })

    return statsMap
  }

  protected async _getVmsStats(
    vms: XoVm[],
    granularity: XapiStatsGranularity
  ): Promise<
    Record<
      string,
      {
        stats: { cpus?: Record<string, (number | null)[]>; memory?: (number | null)[]; memoryFree?: (number | null)[] }
      }
    >
  > {
    const statsMap: Record<
      string,
      {
        stats: { cpus?: Record<string, (number | null)[]>; memory?: (number | null)[]; memoryFree?: (number | null)[] }
      }
    > = {}

    const results = await Promise.allSettled(
      vms.map(vm =>
        this._xo.getXapiVmStats(vm.id, granularity).then(vmStats => {
          statsMap[vm.id] = { stats: vmStats.stats }
        })
      )
    )

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const vm = vms[index]
        log.warn('Failed to fetch stats for VM — skipping', {
          vmId: vm?.id,
          error: result.reason,
        })
      }
    })

    return statsMap
  }

  protected async _getVmsAverages(vms: XoVm[], hostById: Record<string, XoHost>): Promise<AveragesMap> {
    const vmsStats = await this._getVmsStats(vms, 'minutes')

    const vmsAverages = computeResourcesAverageWithWeight(
      computeResourcesAverage(vms, vmsStats, EXECUTION_DELAY),
      computeResourcesAverage(vms, vmsStats, MINUTES_OF_HISTORICAL_DATA),
      0.75
    )

    // Normalize CPU usage: virtual CPUs → real CPU fraction
    const vmsByHost = new Map<string, XoVm[]>()
    for (const vm of vms) {
      const containerId = vm.$container
      const existing = vmsByHost.get(containerId)
      if (existing !== undefined) {
        existing.push(vm)
      } else {
        vmsByHost.set(containerId, [vm])
      }
    }

    for (const [hostId, hostVms] of vmsByHost) {
      const host = hostById[hostId]
      if (host === undefined) {
        continue
      }
      const physicalCpuCount = host.cpus.cores ?? parseInt(host.CPUs['cpu_count'] ?? '1', 10)
      setRealCpuAverageOfVms(hostVms, vmsAverages, physicalCpuCount)
    }

    return vmsAverages
  }

  // ===================================================================
  // Threshold analysis
  // ===================================================================

  protected async _getHostStatsAverages({
    hosts,
    toOptimizeOnly = false,
    checkAverages = false,
  }: {
    hosts: XoHost[]
    toOptimizeOnly?: boolean
    checkAverages?: boolean
  }): Promise<HostStatsAveragesResult | undefined> {
    const hostsStats = await this._getHostsStats(hosts, 'minutes')
    const hostsWithStats = hosts.filter(host => hostsStats[host.id] !== undefined)

    const recentAverages = computeResourcesAverage(hostsWithStats, hostsStats, EXECUTION_DELAY)

    let hostsToOptimize: XoHost[] | undefined
    if (toOptimizeOnly) {
      hostsToOptimize = checkAverages
        ? this._checkResourcesAverages(hostsWithStats, recentAverages, computeWeightedPoolAverageCpu(recentAverages))
        : this._checkResourcesThresholds(hostsWithStats, recentAverages)

      if (hostsToOptimize.length === 0) {
        log.debug('No hosts above threshold', { planName: this._name })
        return undefined
      }
    }

    const historicalAverages = computeResourcesAverage(hostsWithStats, hostsStats, MINUTES_OF_HISTORICAL_DATA)
    const weightedAverages = computeResourcesAverageWithWeight(recentAverages, historicalAverages, 0.75)

    if (toOptimizeOnly && hostsToOptimize !== undefined) {
      hostsToOptimize = checkAverages
        ? this._checkResourcesAverages(
            hostsToOptimize,
            weightedAverages,
            computeWeightedPoolAverageCpu(weightedAverages)
          )
        : this._checkResourcesThresholds(hostsToOptimize, weightedAverages)

      if (hostsToOptimize.length === 0) {
        log.debug('No hosts above threshold after weighted average check', { planName: this._name })
        return undefined
      }
    }

    return {
      toOptimize: hostsToOptimize ?? hostsWithStats,
      averages: weightedAverages,
      ...(checkAverages && { poolAverage: computeWeightedPoolAverageCpu(weightedAverages) }),
    }
  }

  // To be overridden by subclasses
  protected _checkResourcesThresholds(_hosts: XoHost[], _averages: AveragesMap): XoHost[] {
    throw new Error(`_checkResourcesThresholds not implemented in plan "${this._name}"`)
  }

  protected _checkResourcesAverages(hosts: XoHost[], _averages: AveragesMap, _poolAverage: number): XoHost[] {
    return hosts
  }

  // ===================================================================
  // Pre-migration validation
  // ===================================================================

  protected _isVmInCooldown(vm: XoVm): boolean {
    const { migrationCooldown, migrationHistory } = this._globalOptions
    if (migrationCooldown <= 0) {
      return false
    }
    const lastMigration = migrationHistory.get(vm.id)
    return lastMigration !== undefined && Date.now() - lastMigration < migrationCooldown
  }

  /**
   * Returns true if the VM is eligible for migration:
   * - Running power state
   * - XenTools installed (required for live migration)
   * - Not in cooldown period
   */
  protected _canMigrateVm(vm: XoVm): boolean {
    if (vm.power_state !== 'Running') {
      log.debug('VM skipped: not running', { vmId: vm.id, powerState: vm.power_state })
      return false
    }
    if (!vm.xentools) {
      log.debug('VM skipped: XenTools not installed', { vmId: vm.id, vmName: vm.name_label })
      return false
    }
    if (this._isVmInCooldown(vm)) {
      log.debug('VM skipped: in cooldown', { vmId: vm.id, vmName: vm.name_label })
      return false
    }
    return true
  }

  // ===================================================================
  // Migration execution (single gating point for dry-run support)
  //
  // No storage migration: migrateVm uses XAPI pool_migrate which
  // does live migration without touching storage.
  // ===================================================================

  protected _migrateVm(vm: XoVm, srcXapi: Xapi, destXapi: Xapi, destHost: XoHost): Promise<void> {
    const { migrationHistory, dryRun } = this._globalOptions

    if (dryRun === true) {
      this._proposedMigrations.push({
        vmId: vm.id,
        vmName: vm.name_label,
        srcHostId: vm.$container as XoHost['id'],
        destHostId: destHost.id,
      })
      return Promise.resolve()
    }

    return this._semaphore
      .run(async () => {
        await this._assertCanMigrateVm(vm, srcXapi, destXapi, destHost)
        await srcXapi.migrateVm(vm.id, destXapi, destHost.id)
      })
      .then(() => {
        migrationHistory.set(vm.id, Date.now())
        log.info('VM migrated', { vmId: vm.id, vmName: vm.name_label, destHostId: destHost.id })
      })
      .catch((error: unknown) => {
        const migrationError = new Error(`Migration of VM "${vm.name_label}" to host "${destHost.name_label}" failed`, {
          cause: error,
        })
        log.error('VM migration failed', { vmId: vm.id, destHostId: destHost.id, error: migrationError })
        throw migrationError
      })
  }

  /**
   * Calls XAPI VM.assert_can_migrate to verify the migration is feasible
   * before consuming a semaphore slot on the actual migration attempt.
   *
   * Token flow (same as VM.migrate_send):
   *   1. destXapi.call('host.migrate_receive') → opaque migration token
   *   2. srcXapi.call('VM.assert_can_migrate', vm.$ref, token, live=true, {}, {}, {})
   *
   * No VDI map and no VIF map because this plugin never does storage migration.
   */
  private async _assertCanMigrateVm(vm: XoVm, srcXapi: Xapi, destXapi: Xapi, destHost: XoHost): Promise<void> {
    const token = await destXapi.call<Record<string, unknown>>(
      'host.migrate_receive',
      destHost._xapiRef,
      null, // use default management network
      {}
    )
    await srcXapi.call(
      'VM.assert_can_migrate',
      vm._xapiRef,
      token,
      true, // live migration
      {}, // vdi_map: empty — no storage migration
      {}, // vif_map: no remapping needed
      {} // options
    )
  }

  // ===================================================================
  // vCPU prepositioning
  // ===================================================================

  protected async _processVcpuPrepositioning(hosts: XoHost[]): Promise<void> {
    // Filter out hosts with unknown CPU count to avoid mass migration on RRD malfunction
    const healthyHosts = hosts.filter(host => (host.cpus.cores ?? 0) > 0)
    if (healthyHosts.length < hosts.length) {
      const unhealthyHosts = hosts.filter(host => (host.cpus.cores ?? 0) === 0)
      for (const unhealthyHost of unhealthyHosts) {
        log.warn('vCPU balancing: host has unexpected CPU value — skipping', {
          hostId: unhealthyHost.id,
          cpus: unhealthyHost.cpus,
        })
      }
      if (healthyHosts.length < 2) {
        return
      }
    }

    const hostById = Object.fromEntries(healthyHosts.map(host => [host.id, host]))
    const runningVms = this._getAllRunningVms().filter(vm => vm.$container in hostById)
    const vcpuHosts = this._buildVcpuHostList(healthyHosts, runningVms)

    const totalVcpus = vcpuHosts.reduce((sum, host) => sum + host.vcpuCount, 0)
    const totalCpus = vcpuHosts.reduce((sum, host) => sum + host.cpuCount, 0)
    if (totalCpus === 0) {
      return
    }
    const idealVcpuPerCpuRatio = totalVcpus / totalCpus

    log.debug('vCPU balancing: evaluating prepositioning', {
      planName: this._name,
      idealVcpuPerCpuRatio,
      hostCount: vcpuHosts.length,
    })

    const minRatio = Math.min(...vcpuHosts.map(vcpuPerCpuRatio))
    const maxRatio = Math.max(...vcpuHosts.map(vcpuPerCpuRatio))
    if (maxRatio === 0 || minRatio / maxRatio > THRESHOLD_VCPU_RATIO) {
      log.debug('vCPU balancing: ratios similar enough — skipping', { minRatio, maxRatio })
      return
    }

    const statsResult = await this._getHostStatsAverages({ hosts: healthyHosts })
    if (statsResult === undefined) {
      return
    }
    const { averages: hostsAverages } = statsResult

    const poolAverageCpu = computeWeightedPoolAverageCpu(hostsAverages)
    if (poolAverageCpu > THRESHOLD_POOL_CPU_PERCENT) {
      log.debug('vCPU balancing: pool too loaded for prepositioning', { poolAverageCpu })
      return
    }

    const vmsAverages = await this._getVmsAverages(runningVms, hostById)
    const migrationPromises: Promise<void>[] = []

    // Sources: hosts that are above ideal ratio
    const sourceCandidates = vcpuHosts
      .filter(
        host =>
          (host.vcpuCount - VCPU_NUMBER_TOLERANCE) / host.cpuCount >= idealVcpuPerCpuRatio &&
          host.vcpuCount > host.cpuCount
      )
      .sort(
        (a, b) =>
          vcpuPerCpuRatio(b) - vcpuPerCpuRatio(a) ||
          (hostsAverages[a.id]?.memoryFree ?? 0) - (hostsAverages[b.id]?.memoryFree ?? 0)
      )

    for (const sourceHost of sourceCandidates) {
      let deltaSource = sourceHost.vcpuCount - sourceHost.cpuCount * idealVcpuPerCpuRatio
      if (deltaSource < VCPU_NUMBER_TOLERANCE) {
        continue
      }

      // Destinations: hosts below ideal ratio
      const destinationCandidates = vcpuHosts
        .filter(host => host.id !== sourceHost.id && host.vcpuCount / host.cpuCount < idealVcpuPerCpuRatio)
        .sort((a, b) => {
          const samePool = Number(b.poolId === sourceHost.poolId) - Number(a.poolId === sourceHost.poolId)
          return samePool !== 0 ? samePool : vcpuPerCpuRatio(a) - vcpuPerCpuRatio(b)
        })

      if (destinationCandidates.length === 0) {
        continue
      }

      // eslint-disable-next-line no-labels
      destinationLoop: for (const destinationHost of destinationCandidates) {
        const destAvg = hostsAverages[destinationHost.id]
        if (
          destAvg === undefined ||
          destinationHost.vcpuCount - destinationHost.cpuCount * idealVcpuPerCpuRatio >= 0 ||
          destAvg.cpu > this._thresholds.cpu.low ||
          destAvg.memoryFree < this._thresholds.memoryFree.low
        ) {
          continue
        }

        let deltaDestination = destinationHost.vcpuCount - destinationHost.cpuCount * idealVcpuPerCpuRatio
        let delta = Math.ceil(Math.min(deltaSource, -deltaDestination))

        const migrableSortedVms = Object.values(sourceHost.vms)
          .filter(vm => {
            const vmAvg = vmsAverages[vm.id]
            return (
              this._canMigrateVm(vm) &&
              destAvg !== undefined &&
              vmAvg !== undefined &&
              destAvg.memoryFree >= vmAvg.memory &&
              vm.CPUs.number <= delta
            )
          })
          .sort((a, b) => b.CPUs.number - a.CPUs.number)

        for (const vm of migrableSortedVms) {
          const vmAvg = vmsAverages[vm.id]
          if (vmAvg === undefined) {
            continue
          }

          if (
            vm.CPUs.number <= delta &&
            destAvg.cpu + vmAvg.cpu < this._thresholds.cpu.low &&
            destAvg.memoryFree - vmAvg.memory > this._thresholds.memoryFree.low
          ) {
            const srcHost = hostById[sourceHost.id]
            const dstHost = hostById[destinationHost.id]
            if (srcHost === undefined || dstHost === undefined) {
              continue
            }

            log.debug('vCPU balancing: scheduling migration', {
              vmId: vm.id,
              vmName: vm.name_label,
              srcHostId: sourceHost.id,
              destHostId: destinationHost.id,
              vcpuCount: vm.CPUs.number,
            })

            sourceHost.vcpuCount -= vm.CPUs.number
            destinationHost.vcpuCount += vm.CPUs.number
            destAvg.cpu += vmAvg.cpu
            destAvg.memoryFree -= vmAvg.memory
            delete sourceHost.vms[vm.id]

            migrationPromises.push(this._migrateVm(vm, this._xo.getXapi(srcHost), this._xo.getXapi(dstHost), dstHost))

            deltaSource = sourceHost.vcpuCount - sourceHost.cpuCount * idealVcpuPerCpuRatio
            if (deltaSource < VCPU_NUMBER_TOLERANCE) {
              // eslint-disable-next-line no-labels
              break destinationLoop
            }
            deltaDestination = destinationHost.vcpuCount - destinationHost.cpuCount * idealVcpuPerCpuRatio
            if (deltaDestination >= 0) {
              break
            }
            delta = deltaSource > -deltaDestination ? Math.ceil(-deltaDestination) : Math.ceil(deltaSource)
          }
        }
      }
    }

    await Promise.allSettled(migrationPromises)
  }

  protected _buildVcpuHostList(hosts: XoHost[], vms: XoVm[]): VcpuHost[] {
    const vcpuHostById: Record<string, VcpuHost> = {}

    for (const host of hosts) {
      const cpuCount = host.cpus.cores ?? parseInt(host.CPUs['cpu_count'] ?? '1', 10)
      vcpuHostById[host.id] = {
        id: host.id,
        poolId: host.$poolId,
        cpuCount,
        vcpuCount: 0,
        vms: {},
      }
    }

    for (const vm of vms) {
      const vcpuHost = vcpuHostById[vm.$container]
      if (vcpuHost === undefined) {
        continue
      }
      vcpuHost.vcpuCount += vm.CPUs.number
      // Only include VMs without affinity/anti-affinity tags and with XenTools
      if (
        vm.xentools &&
        vm.tags.every(tag => !this._antiAffinityTags.includes(tag) && !this._affinityTags.includes(tag))
      ) {
        vcpuHost.vms[vm.id] = vm
      }
    }

    return Object.values(vcpuHostById)
  }

  // ===================================================================
  // Anti-affinity
  // ===================================================================

  protected async _processAntiAffinity(): Promise<void> {
    if (this._antiAffinityTags.length === 0) {
      return
    }

    const allHosts = this._getHosts()
    if (allHosts.length <= 1) {
      return
    }
    const hostById = Object.fromEntries(allHosts.map(host => [host.id, host]))
    const runningVms = this._getAllRunningVms().filter(vm => vm.$container in hostById)
    const taggedHostsResult = this._buildTaggedHosts({
      hosts: allHosts,
      tagList: this._antiAffinityTags,
      vms: runningVms,
    })

    // Check if any anti-affinity tag has imbalance (diff > 1 between most and least loaded host)
    const tagsWithImbalance: Record<string, number> = {}
    for (const watchedTag of this._antiAffinityTags) {
      const tagCounts = taggedHostsResult.hosts.map(host => host.tags[watchedTag] ?? 0)
      const diff = Math.max(...tagCounts) - Math.min(...tagCounts)
      if (diff > 1) {
        tagsWithImbalance[watchedTag] = diff - 1
      }
    }

    if (Object.keys(tagsWithImbalance).length === 0) {
      return
    }

    log.debug('Anti-affinity: rebalancing', {
      planName: this._name,
      tagsWithImbalance,
    })

    const vmsAverages = await this._getVmsAverages(runningVms, hostById)
    const hostsStatsResult = await this._getHostStatsAverages({ hosts: allHosts })
    if (hostsStatsResult === undefined) {
      return
    }
    const { averages: hostsAverages } = hostsStatsResult

    const migrationPromises: Promise<void>[] = []
    for (const tag of Object.keys(tagsWithImbalance)) {
      migrationPromises.push(
        ...this._processAntiAffinityTag({ tag, vmsAverages, hostsAverages, taggedHostsResult, hostById })
      )
    }

    await Promise.allSettled(migrationPromises)
  }

  private _processAntiAffinityTag({
    tag,
    vmsAverages,
    hostsAverages,
    taggedHostsResult,
    hostById,
  }: {
    tag: string
    vmsAverages: AveragesMap
    hostsAverages: AveragesMap
    taggedHostsResult: TaggedHostsResult
    hostById: Record<string, XoHost>
  }): Promise<void>[] {
    const migrationPromises: Promise<void>[] = []

    while (true) {
      let foundMigration = false

      // Sources: hosts with more than 1 VM with the target tag, sorted most-loaded first
      const sourcesSorted = taggedHostsResult.hosts
        .filter(host => (host.tags[tag] ?? 0) > 1)
        .sort((a, b) => {
          const tagDiff = (b.tags[tag] ?? 0) - (a.tags[tag] ?? 0)
          if (tagDiff !== 0) {
            return tagDiff
          }
          return (hostsAverages[b.id]?.memoryFree ?? 0) - (hostsAverages[a.id]?.memoryFree ?? 0)
        })

      for (let i = sourcesSorted.length - 1; i >= 0; i--) {
        const sourceHost = sourcesSorted[i]
        if (sourceHost === undefined) {
          break
        }

        const destinationsSorted = taggedHostsResult.hosts
          .filter(host => host.id !== sourceHost.id && (host.tags[tag] ?? 0) + 1 < (sourceHost.tags[tag] ?? 0))
          .sort((a, b) => {
            const tagDiff = (a.tags[tag] ?? 0) - (b.tags[tag] ?? 0)
            if (tagDiff !== 0) {
              return tagDiff
            }
            const samePool = Number(a.poolId !== sourceHost.poolId) - Number(b.poolId !== sourceHost.poolId)
            if (samePool !== 0) {
              return samePool
            }
            return (hostsAverages[b.id]?.memoryFree ?? 0) - (hostsAverages[a.id]?.memoryFree ?? 0)
          })

        if (destinationsSorted.length === 0) {
          return migrationPromises
        }

        const taggedVmsOnSource = Object.values(sourceHost.vms).filter(vm => vm.tags.includes(tag))

        let selectedVm: XoVm | undefined
        let selectedDestination: TaggedHost | undefined

        for (const destinationHost of destinationsSorted) {
          const destAvg = hostsAverages[destinationHost.id]
          const candidateVms = taggedVmsOnSource.filter(vm => {
            const vmAvg = vmsAverages[vm.id]
            return (
              this._canMigrateVm(vm) &&
              destAvg !== undefined &&
              vmAvg !== undefined &&
              vmAvg.memory <= destAvg.memoryFree &&
              vm.tags.every(vmTag => !this._affinityTags.includes(vmTag))
            )
          })

          selectedVm = this._selectBestAntiAffinityVm({
            candidates: candidateVms,
            vmsAverages,
            taggedHostsResult,
            sourceHost,
            destinationHost,
          })
          if (selectedVm !== undefined) {
            selectedDestination = destinationHost
            break
          }
        }

        if (selectedVm === undefined || selectedDestination === undefined) {
          continue
        }

        const srcHost = hostById[sourceHost.id]
        const dstHost = hostById[selectedDestination.id]
        if (srcHost === undefined || dstHost === undefined) {
          continue
        }

        log.debug('Anti-affinity: migrating VM', {
          vmId: selectedVm.id,
          vmName: selectedVm.name_label,
          srcHostId: sourceHost.id,
          destHostId: selectedDestination.id,
          tag,
        })

        // Update in-memory state
        for (const vmTag of selectedVm.tags) {
          if (this._antiAffinityTags.includes(vmTag)) {
            sourceHost.tags[vmTag] = (sourceHost.tags[vmTag] ?? 0) - 1
            selectedDestination.tags[vmTag] = (selectedDestination.tags[vmTag] ?? 0) + 1
          }
        }

        const destAvg = hostsAverages[selectedDestination.id]
        const vmAvg = vmsAverages[selectedVm.id]
        if (destAvg !== undefined && vmAvg !== undefined) {
          destAvg.cpu += vmAvg.cpu
          destAvg.memoryFree -= vmAvg.memory
        }

        delete sourceHost.vms[selectedVm.id]

        migrationPromises.push(
          this._migrateVm(selectedVm, this._xo.getXapi(srcHost), this._xo.getXapi(dstHost), dstHost)
        )
        foundMigration = true
        break
      }

      if (!foundMigration) {
        break
      }
    }

    return migrationPromises
  }

  private _selectBestAntiAffinityVm({
    candidates,
    vmsAverages,
    taggedHostsResult,
    sourceHost,
    destinationHost,
  }: {
    candidates: XoVm[]
    vmsAverages: AveragesMap
    taggedHostsResult: TaggedHostsResult
    sourceHost: TaggedHost
    destinationHost: TaggedHost
  }): XoVm | undefined {
    let bestVariance = this._computeAntiAffinityVariance(taggedHostsResult)
    let bestVm: XoVm | undefined

    for (const vm of candidates) {
      const antiAffinityTagsOnVm = vm.tags.filter(tag => this._antiAffinityTags.includes(tag))

      for (const tag of antiAffinityTagsOnVm) {
        sourceHost.tags[tag] = (sourceHost.tags[tag] ?? 0) - 1
        destinationHost.tags[tag] = (destinationHost.tags[tag] ?? 0) + 1
      }

      const variance = this._computeAntiAffinityVariance(taggedHostsResult)

      for (const tag of antiAffinityTagsOnVm) {
        sourceHost.tags[tag] = (sourceHost.tags[tag] ?? 0) + 1
        destinationHost.tags[tag] = (destinationHost.tags[tag] ?? 0) - 1
      }

      if (variance < bestVariance) {
        bestVariance = variance
        bestVm = vm
      }
    }

    return bestVm
  }

  private _computeAntiAffinityVariance(taggedHostsResult: TaggedHostsResult): number {
    let totalVariance = 0
    const { hosts } = taggedHostsResult

    for (const tag of Object.keys(taggedHostsResult.tagCount)) {
      const k = hosts[0]?.tags[tag] ?? 0
      let sumDiff = 0
      let sumDiffSquared = 0

      for (const host of hosts) {
        const diff = (host.tags[tag] ?? 0) - k
        sumDiff += diff
        sumDiffSquared += diff * diff
      }

      const n = hosts.length
      if (n > 0) {
        totalVariance += (sumDiffSquared - (sumDiff * sumDiff) / n) / n
      }
    }

    return totalVariance
  }

  protected _buildTaggedHosts({
    hosts,
    tagList,
    vms,
    includeUntaggedVms = false,
  }: {
    hosts: XoHost[]
    tagList: string[]
    vms: XoVm[]
    includeUntaggedVms?: boolean
  }): TaggedHostsResult {
    const tagCount: Record<string, number> = Object.fromEntries(tagList.map(tag => [tag, 0]))
    const taggedHostById: Record<string, TaggedHost> = {}

    for (const host of hosts) {
      taggedHostById[host.id] = {
        id: host.id,
        poolId: host.$poolId,
        tags: Object.fromEntries(tagList.map(tag => [tag, 0])),
        vms: {},
      }
    }

    for (const vm of vms) {
      const taggedHost = taggedHostById[vm.$container]
      if (taggedHost === undefined) {
        continue
      }

      if (includeUntaggedVms) {
        taggedHost.vms[vm.id] = vm
      }

      for (const tag of vm.tags) {
        if (tagList.includes(tag)) {
          tagCount[tag] = (tagCount[tag] ?? 0) + 1
          taggedHost.tags[tag] = (taggedHost.tags[tag] ?? 0) + 1
          taggedHost.vms[vm.id] = vm
        }
      }
    }

    return { tagCount, hosts: Object.values(taggedHostById) }
  }

  // ===================================================================
  // Affinity
  // ===================================================================

  protected async _processAffinity(): Promise<void> {
    if (this._affinityTags.length === 0) {
      return
    }

    const allHosts = this._getHosts()
    if (allHosts.length <= 1) {
      return
    }
    const hostById = Object.fromEntries(allHosts.map(host => [host.id, host]))
    const runningVms = this._getAllRunningVms().filter(vm => vm.$container in hostById)

    const taggedHostsResult = this._buildTaggedHosts({
      hosts: allHosts,
      tagList: this._affinityTags,
      vms: runningVms,
      includeUntaggedVms: true,
    })

    // Find tags that are spread across multiple hosts
    const spreadTags = this._affinityTags.filter(
      tag => taggedHostsResult.hosts.filter(host => (host.tags[tag] ?? 0) > 0).length > 1
    )

    if (spreadTags.length === 0) {
      return
    }

    const coalitions = this._computeCoalitions(runningVms, this._affinityTags)
    const hasMultiTagVms = Object.values(coalitions).some(coalition => coalition.length > 1)
    if (hasMultiTagVms) {
      log.warn('affinity: VMs with multiple affinity tags detected — this should be avoided', {
        planName: this._name,
        coalitions: inspect(coalitions),
      })
    }

    log.debug('Affinity: rebalancing spread tags', { planName: this._name, spreadTags })

    const vmsAverages = await this._getVmsAverages(runningVms, hostById)
    const hostsStatsResult = await this._getHostStatsAverages({ hosts: allHosts })
    if (hostsStatsResult === undefined) {
      return
    }
    const { averages: hostsAverages } = hostsStatsResult

    const migrationPromises: Promise<void>[] = []
    const processedCoalitions = new Set<string>()

    for (const tag of spreadTags) {
      if (!processedCoalitions.has(tag)) {
        const tagPromises = await this._processAffinityTag({
          tag,
          vmsAverages,
          hostsAverages,
          taggedHostsResult,
          hostById,
          coalition: coalitions[tag] ?? [tag],
        })
        migrationPromises.push(...tagPromises)
        for (const coalitionTag of coalitions[tag] ?? [tag]) {
          processedCoalitions.add(coalitionTag)
        }
      }
    }

    await Promise.allSettled(migrationPromises)
  }

  private async _processAffinityTag({
    tag,
    vmsAverages,
    hostsAverages,
    taggedHostsResult,
    hostById,
    coalition,
  }: {
    tag: string
    vmsAverages: AveragesMap
    hostsAverages: AveragesMap
    taggedHostsResult: TaggedHostsResult
    hostById: Record<string, XoHost>
    coalition: string[]
  }): Promise<Promise<void>[]> {
    const migrationPromises: Promise<void>[] = []

    log.debug('Affinity: processing tag coalition', { tag, coalition })

    // Count coalition VMs per host to find the best destination
    const coalitionVmCountPerHost = Object.fromEntries(
      taggedHostsResult.hosts.map(host => [
        host.id,
        coalition.reduce((sum, coalitionTag) => sum + (host.tags[coalitionTag] ?? 0), 0),
      ])
    )

    const hostsWithCoalitionVms = taggedHostsResult.hosts
      .filter(host => coalition.some(coalitionTag => (host.tags[coalitionTag] ?? 0) > 0))
      .sort((a, b) => {
        const countDiff = (coalitionVmCountPerHost[a.id] ?? 0) - (coalitionVmCountPerHost[b.id] ?? 0)
        if (countDiff !== 0) {
          return countDiff
        }
        return (hostsAverages[b.id]?.memoryFree ?? 0) - (hostsAverages[a.id]?.memoryFree ?? 0)
      })

    // The host with the most coalition VMs becomes the destination
    let destinationHost = hostsWithCoalitionVms.pop()
    if (destinationHost === undefined) {
      return migrationPromises
    }

    for (const sourceHost of hostsWithCoalitionVms) {
      const dstHostObj = hostById[destinationHost.id]
      const srcHostObj = hostById[sourceHost.id]
      if (dstHostObj === undefined || srcHostObj === undefined) {
        continue
      }

      log.debug('Affinity: evaluating host pair', {
        srcHostId: sourceHost.id,
        destHostId: destinationHost.id,
        tag,
      })

      const migrableVms = Object.values(sourceHost.vms).filter(
        vm => vm.xentools && this._canMigrateVm(vm) && vm.tags.some(t => coalition.includes(t))
      )

      for (const vm of migrableVms) {
        const vmAvg = vmsAverages[vm.id]
        if (vmAvg === undefined) {
          continue
        }

        let loopCountdown = hostsWithCoalitionVms.length
        while (
          (hostsAverages[destinationHost.id]?.memoryFree ?? 0) - vmAvg.memory <
          this._thresholds.memoryFree.critical
        ) {
          loopCountdown--
          if (loopCountdown < 0) {
            log.warn('affinity: Broke out of potential infinite loop', { planName: this._name })
            break
          }

          // Try to free memory on destination host by migrating non-tagged VMs away
          const { promises: freeingPromises, success } = await this._migrateUntaggedVmsAway({
            crowdedHost: destinationHost,
            hostsAverages,
            vmsAverages,
            hostById,
            taggedHostsResult,
            memoryNeeded: vmAvg.memory,
          })
          migrationPromises.push(...freeingPromises)

          if (!success) {
            log.warn('affinity: Cannot satisfy affinity constraints — destination full', {
              planName: this._name,
              tag,
              destHostId: destinationHost.id,
            })
            const nextDestination = hostsWithCoalitionVms.pop()
            if (nextDestination === undefined) {
              return migrationPromises
            }
            destinationHost = nextDestination
          }
        }

        migrationPromises.push(
          this._migrateVmAndUpdateState({
            dstHost: dstHostObj,
            srcHost: srcHostObj,
            sourceTaggedHost: sourceHost,
            destinationTaggedHost: destinationHost,
            vm,
            hostsAverages,
            vmAvg,
            isAffinityMigration: true,
          })
        )
      }
    }

    return migrationPromises
  }

  private async _migrateUntaggedVmsAway({
    crowdedHost,
    hostsAverages,
    vmsAverages,
    hostById,
    taggedHostsResult,
    memoryNeeded,
  }: {
    crowdedHost: TaggedHost
    hostsAverages: AveragesMap
    vmsAverages: AveragesMap
    hostById: Record<string, XoHost>
    taggedHostsResult: TaggedHostsResult
    memoryNeeded: number
  }): Promise<MigrateOtherVmsResult> {
    const migrationPromises: Promise<void>[] = []

    // Sort untagged VMs by memory (largest first) to minimize number of migrations
    const untaggedVms = Object.values(crowdedHost.vms)
      .filter(
        vm =>
          vm.xentools &&
          this._canMigrateVm(vm) &&
          vm.tags.every(tag => !this._affinityTags.includes(tag) && !this._antiAffinityTags.includes(tag))
      )
      .sort((a, b) => (vmsAverages[b.id]?.memory ?? 0) - (vmsAverages[a.id]?.memory ?? 0))

    log.debug('Affinity: trying to move away untagged VMs to free memory', {
      planName: this._name,
      hostId: crowdedHost.id,
      vmCount: untaggedVms.length,
    })

    for (const vm of untaggedVms) {
      const vmAvg = vmsAverages[vm.id]
      if (vmAvg === undefined) {
        continue
      }

      const destinationTaggedHost = taggedHostsResult.hosts
        .filter(host => host.id !== crowdedHost.id)
        .sort((a, b) => (hostsAverages[b.id]?.memoryFree ?? 0) - (hostsAverages[a.id]?.memoryFree ?? 0))
        .find(host => {
          const destAvg = hostsAverages[host.id]
          return (
            destAvg !== undefined &&
            destAvg.cpu + vmAvg.cpu <= this._thresholds.cpu.critical &&
            destAvg.memoryFree - vmAvg.memory >= this._thresholds.memoryFree.critical
          )
        })

      if (destinationTaggedHost === undefined) {
        continue
      }

      const srcHostObj = hostById[crowdedHost.id]
      const dstHostObj = hostById[destinationTaggedHost.id]
      if (srcHostObj === undefined || dstHostObj === undefined) {
        continue
      }

      migrationPromises.push(
        this._migrateVmAndUpdateState({
          dstHost: dstHostObj,
          srcHost: srcHostObj,
          sourceTaggedHost: crowdedHost,
          destinationTaggedHost,
          vm,
          hostsAverages,
          vmAvg,
          isAffinityMigration: false,
        })
      )

      const crowdedHostAvg = hostsAverages[crowdedHost.id]
      if (
        crowdedHostAvg !== undefined &&
        crowdedHostAvg.memoryFree - memoryNeeded > this._thresholds.memoryFree.critical
      ) {
        return { promises: migrationPromises, success: true }
      }
    }

    return { promises: migrationPromises, success: false }
  }

  private _migrateVmAndUpdateState({
    dstHost,
    srcHost,
    sourceTaggedHost,
    destinationTaggedHost,
    vm,
    hostsAverages,
    vmAvg,
    isAffinityMigration,
  }: {
    dstHost: XoHost
    srcHost: XoHost
    sourceTaggedHost: TaggedHost
    destinationTaggedHost: TaggedHost
    vm: XoVm
    hostsAverages: AveragesMap
    vmAvg: { cpu: number; memory: number }
    isAffinityMigration: boolean
  }): Promise<void> {
    log.debug('Affinity: migrating VM', {
      vmId: vm.id,
      vmName: vm.name_label,
      srcHostId: srcHost.id,
      destHostId: dstHost.id,
    })

    if (isAffinityMigration) {
      for (const tag of vm.tags) {
        if (this._affinityTags.includes(tag)) {
          sourceTaggedHost.tags[tag] = (sourceTaggedHost.tags[tag] ?? 0) - 1
          destinationTaggedHost.tags[tag] = (destinationTaggedHost.tags[tag] ?? 0) + 1
        }
      }
    }

    const srcAvg = hostsAverages[srcHost.id]
    const dstAvg = hostsAverages[dstHost.id]
    if (srcAvg !== undefined) {
      srcAvg.cpu -= vmAvg.cpu
      srcAvg.memoryFree += vmAvg.memory
    }
    if (dstAvg !== undefined) {
      dstAvg.cpu += vmAvg.cpu
      dstAvg.memoryFree -= vmAvg.memory
    }

    delete sourceTaggedHost.vms[vm.id]

    return this._migrateVm(vm, this._xo.getXapi(srcHost), this._xo.getXapi(dstHost), dstHost)
  }

  // ===================================================================
  // Coalition computation for affinity tags
  // ===================================================================

  _computeCoalitions(vms: XoVm[], affinityTags: string[]): Record<string, string[]> {
    const coalitionSets: Record<string, Set<string>> = {}
    for (const tag of affinityTags) {
      coalitionSets[tag] = new Set([tag])
    }

    for (const vm of vms) {
      const vmAffinityTags = vm.tags.filter(tag => affinityTags.includes(tag))
      if (vmAffinityTags.length > 1) {
        for (const tag1 of vmAffinityTags) {
          for (const tag2 of vmAffinityTags) {
            coalitionSets[tag1]?.add(tag2)
          }
        }
      }
    }

    // Propagate indirect links (transitive closure)
    for (const coalitionSet of Object.values(coalitionSets)) {
      for (const coalitionTag of coalitionSet) {
        const neighborCoalition = coalitionSets[coalitionTag]
        if (neighborCoalition !== undefined) {
          for (const neighborTag of neighborCoalition) {
            coalitionSet.add(neighborTag)
          }
        }
      }
    }

    return Object.fromEntries(Object.entries(coalitionSets).map(([tag, set]) => [tag, Array.from(set)]))
  }
}

// Re-export for use in density-plan and performance-plan subclasses
export { computeWeightedPoolAverageCpu }
