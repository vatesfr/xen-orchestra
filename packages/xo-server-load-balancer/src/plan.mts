import lodash from 'lodash'
const { filter, groupBy, includes, intersection, isEmpty, keyBy, map: mapToArray, maxBy, minBy, size, sortBy } = lodash
import { inspect } from 'util'
import type { XapiHostStatsRaw, XapiVmStatsRaw, XapiStatsGranularity, XoApp, XoHost, XoPool, XoVm } from '@vates/types'
import type { Xapi } from '@vates/types'

import { EXECUTION_DELAY, debug, warn } from './utils.mjs'

// ===================================================================

const MINUTES_OF_HISTORICAL_DATA = 30

// CPU threshold in percent.
export const DEFAULT_CRITICAL_THRESHOLD_CPU = 90.0

// Memory threshold in MB.
export const DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE = 1000.0

// Thresholds factors.
const HIGH_THRESHOLD_FACTOR = 0.85
const LOW_THRESHOLD_FACTOR = 0.65

const HIGH_THRESHOLD_MEMORY_FREE_FACTOR = 1.2
const LOW_THRESHOLD_MEMORY_FREE_FACTOR = 1.5

const THRESHOLD_VCPU_RATIO = 0.9

// Constants relative to vCPU-prepositioning

// How close to ideal vCPU/CPU ratio do we want hosts to be (must be >= 1)
const VCPU_NUMBER_TOLERANCE = 1
// Max percentage of pool's CPU usage allowed to execute vCPU prepositioning
const THRESHOLD_POOL_CPU = 40

// ===================================================================
// Internal types
// ===================================================================

export interface ResourceAverages {
  cpu: number
  nCpus: number
  memoryFree: number
  memory: number
}

export type HostAveragesMap = Record<string, ResourceAverages>

interface HostStats {
  nPoints: number
  stats: XapiHostStatsRaw
  averages: Record<string, number>
}

interface VmStats {
  nPoints: number
  stats: XapiVmStatsRaw
  averages: Record<string, number>
}

export interface ThresholdRange {
  critical: number
  high: number
  low: number
}

export interface Thresholds {
  cpu: ThresholdRange
  memoryFree: ThresholdRange
}

export interface GlobalOptions {
  ignoredVmTags: Set<string>
  migrationCooldown: number
  migrationHistory: Map<string, number>
}

export interface PlanOptions {
  excludedHosts?: string[]
  thresholds?: { cpu?: number; memoryFree?: number }
  balanceVcpus?: false | 'preventive' | true
  affinityTags?: string[]
  antiAffinityTags?: string[]
  dryRunResult?: Map<string, string>
}

export interface TaggedHost {
  id: XoHost['id']
  poolId: XoPool['id']
  tags: Record<string, number>
  vms: Record<string, XoVm>
}

interface TaggedHostsResult {
  tagCount: Record<string, number>
  hosts: TaggedHost[]
}

export interface VcpuHost {
  id: XoHost['id']
  poolId: XoPool['id']
  cpuCount: number
  vcpuCount: number
  vms: Record<string, XoVm>
}

// ===================================================================

const numberOrDefault = (value: number | undefined | null, def: number): number =>
  value != null && value >= 0 ? value : def

export const debugAffinity = (str: string) => debug(`affinity: ${str}`)
export const debugAntiAffinity = (str: string) => debug(`anti-affinity: ${str}`)
export const debugVcpuBalancing = (str: string) => debug(`vCPU balancing: ${str}`)

// ===================================================================
// Averages.
// ===================================================================

function computeAverage(values: (number | null)[] | undefined, nPoints?: number): number {
  if (values === undefined) {
    return 0
  }

  let sum = 0
  let tot = 0

  const { length } = values
  const start = nPoints !== undefined ? length - nPoints : 0

  for (let i = start; i < length; i++) {
    const value = values[i]

    sum += value ?? 0

    if (value) {
      tot += 1
    }
  }

  return sum / tot
}

function computeResourcesAverage(
  objects: XoHost[] | XoVm[],
  objectsStats: Record<string, HostStats | VmStats>,
  nPoints: number
): HostAveragesMap {
  const averages: HostAveragesMap = {}

  for (const object of objects) {
    const { id } = object
    const entry = objectsStats[id]
    if (entry === undefined) {
      continue
    }
    const { stats } = entry

    averages[id] = {
      cpu: computeAverage(
        mapToArray(stats.cpus as Record<string, (number | null)[]> | undefined, (cpu: (number | null)[]) =>
          computeAverage(cpu, nPoints)
        )
      ),
      nCpus: size(stats.cpus),
      memoryFree: computeAverage(stats.memoryFree, nPoints),
      memory: computeAverage(stats.memory, nPoints),
    }
  }

  return averages
}

function computeResourcesAverageWithWeight(
  averages1: HostAveragesMap,
  averages2: HostAveragesMap,
  ratio: number
): HostAveragesMap {
  const averages: HostAveragesMap = {}

  for (const id in averages1) {
    const objectAverages = (averages[id] = {} as ResourceAverages)
    const a1 = averages1[id]
    const a2 = averages2[id]

    if (a1 === undefined || a2 === undefined) {
      continue
    }

    for (const key of Object.keys(a1) as (keyof ResourceAverages)[]) {
      const average1 = a1[key]
      if (average1 === undefined) {
        continue
      }
      objectAverages[key] = (average1 * ratio + (a2[key] ?? 0) * (1 - ratio)) as never
    }
  }

  return averages
}

function computeAverageCpu(hostsStats: HostAveragesMap): number {
  const hostsStatsArray = Object.values(hostsStats)
  const totalNbCpus = hostsStatsArray.reduce((sum, host) => sum + host.nCpus, 0)
  const weightedSum = hostsStatsArray.reduce((sum, host) => sum + host.cpu * host.nCpus, 0)
  return weightedSum / totalNbCpus
}

function setRealCpuAverageOfVms(vms: XoVm[], vmsAverages: HostAveragesMap, nCpus: number): void {
  for (const vm of vms) {
    const averages = vmsAverages[vm.id]
    if (averages !== undefined) {
      averages.cpu *= averages.nCpus / nCpus
    }
  }
}

// ===================================================================

function vcpuPerCpuRatio(host: VcpuHost): number {
  return host.vcpuCount / host.cpuCount
}

// ===================================================================

export default class Plan {
  xo: XoApp
  _name: string | undefined
  _poolIds: string[]
  _excludedHosts: string[] | undefined
  _thresholds: Thresholds
  _affinityTags: string[]
  _antiAffinityTags: string[]
  _performanceSubmode: 'conservative' | 'preventive' | 'vCpuPrepositioning'
  _globalOptions: GlobalOptions
  _concurrentMigrationLimiter: (this: Xapi, methodName: string, ...args: unknown[]) => Promise<unknown>
  _dryRunResult: Map<string, string> | undefined

  constructor(
    xo: XoApp,
    name: string | undefined,
    poolIds: string[],
    { excludedHosts, thresholds, balanceVcpus, affinityTags = [], antiAffinityTags = [], dryRunResult }: PlanOptions,
    globalOptions: GlobalOptions,
    concurrentMigrationLimiter: (this: Xapi, methodName: string, ...args: unknown[]) => Promise<unknown>
  ) {
    this.xo = xo
    this._name = name
    this._poolIds = poolIds ?? []
    this._excludedHosts = excludedHosts
    this._thresholds = {
      cpu: {
        critical: numberOrDefault(thresholds?.cpu, DEFAULT_CRITICAL_THRESHOLD_CPU),
        high: 0,
        low: 0,
      },
      memoryFree: {
        critical: numberOrDefault(thresholds?.memoryFree, DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE) * 1024 * 1024,
        high: 0,
        low: 0,
      },
    }
    this._affinityTags = affinityTags
    this._antiAffinityTags = antiAffinityTags
    // balanceVcpus variable name was kept for compatibility with past configuration schema
    this._performanceSubmode =
      balanceVcpus === false
        ? 'conservative'
        : balanceVcpus === true
          ? 'vCpuPrepositioning'
          : (balanceVcpus ?? 'conservative')
    this._globalOptions = globalOptions
    this._concurrentMigrationLimiter = concurrentMigrationLimiter
    this._dryRunResult = dryRunResult

    for (const key of Object.keys(this._thresholds) as (keyof Thresholds)[]) {
      const attr = this._thresholds[key]
      const { critical } = attr

      if (key === 'memoryFree') {
        attr.high = critical * HIGH_THRESHOLD_MEMORY_FREE_FACTOR
        attr.low = critical * LOW_THRESHOLD_MEMORY_FREE_FACTOR
      } else {
        attr.high = critical * HIGH_THRESHOLD_FACTOR
        attr.low = critical * LOW_THRESHOLD_FACTOR
      }
    }
  }

  execute(): Promise<void> {
    throw new Error('Not implemented')
  }

  // ===================================================================
  // Get hosts to optimize.
  // ===================================================================

  async _getHostStatsAverages({
    hosts,
    toOptimizeOnly = false,
    checkAverages = false,
  }: {
    hosts: XoHost[]
    toOptimizeOnly?: boolean
    checkAverages?: boolean
  }): Promise<
    | {
        toOptimize: XoHost[] | undefined
        averages: HostAveragesMap
        poolAverage?: number
      }
    | undefined
  > {
    const hostsStats = await this._getHostsStats(hosts, 'minutes')

    const avgNow = computeResourcesAverage(hosts, hostsStats, EXECUTION_DELAY)
    let toOptimize: XoHost[] | undefined
    if (toOptimizeOnly) {
      // Check if a resource utilization exceeds threshold.
      toOptimize = checkAverages
        ? this._checkResourcesAverages(hosts, avgNow, computeAverageCpu(avgNow))
        : this._checkResourcesThresholds(hosts, avgNow)
      if (toOptimize.length === 0) {
        debug('No hosts to optimize.')
        return
      }
    }

    const avgBefore = computeResourcesAverage(hosts, hostsStats, MINUTES_OF_HISTORICAL_DATA)
    const avgWithRatio = computeResourcesAverageWithWeight(avgNow, avgBefore, 0.75)

    if (toOptimizeOnly && toOptimize !== undefined) {
      // Check in the last 30 min interval with ratio.
      toOptimize = checkAverages
        ? this._checkResourcesAverages(toOptimize, avgWithRatio, computeAverageCpu(avgWithRatio))
        : this._checkResourcesThresholds(toOptimize, avgWithRatio)
      if (toOptimize.length === 0) {
        debug('No hosts to optimize.')
        return
      }
    }

    return {
      toOptimize,
      averages: avgWithRatio,
      ...(checkAverages && { poolAverage: computeAverageCpu(avgWithRatio) }),
    }
  }

  _checkResourcesThresholds(_objects: XoHost[], _averages: HostAveragesMap): XoHost[] {
    throw new Error('Not implemented')
  }

  _checkResourcesAverages(objects: XoHost[], _averages: HostAveragesMap, _poolAverage: number): XoHost[] {
    // Default: no hosts to optimize. Override in subclasses.
    return objects
  }

  // ===================================================================
  // Get objects.
  // ===================================================================

  _getPlanPools(): Record<string, XoPool> {
    const pools: Record<string, XoPool> = {}

    try {
      for (const poolId of this._poolIds) {
        pools[poolId] = this.xo.getObject<XoPool>(poolId as XoPool['id'])
      }
    } catch (_) {
      return {}
    }

    return pools
  }

  // Compute hosts for each pool. They can change over time.
  _getHosts({ powerState = 'Running' }: { powerState?: string } = {}): XoHost[] {
    return filter(
      this.xo.getObjects(),
      (object): object is XoHost =>
        object.type === 'host' &&
        includes(this._poolIds, object.$poolId) &&
        object.power_state === powerState &&
        !includes(this._excludedHosts, object.id)
    )
  }

  _getAllRunningVms(): XoVm[] {
    return filter(
      this.xo.getObjects(),
      (object): object is XoVm =>
        object.type === 'VM' &&
        object.power_state === 'Running' &&
        !object.tags.some(tag => this._globalOptions.ignoredVmTags.has(tag))
    )
  }

  // ===================================================================
  // Get stats.
  // ===================================================================

  async _getHostsStats(hosts: XoHost[], granularity: XapiStatsGranularity): Promise<Record<string, HostStats>> {
    const hostsStats: Record<string, HostStats> = {}

    await Promise.all(
      hosts.map(host =>
        this.xo.getXapiHostStats(host.id, granularity).then(hostStats => {
          hostsStats[host.id] = {
            nPoints: hostStats.stats.cpus?.['0']?.length ?? 0,
            stats: hostStats.stats,
            averages: {},
          }
        })
      )
    )

    return hostsStats
  }

  async _getVmsStats(vms: XoVm[], granularity: XapiStatsGranularity): Promise<Record<string, VmStats>> {
    const vmsStats: Record<string, VmStats> = {}

    await Promise.all(
      vms.map(vm =>
        this.xo.getXapiVmStats(vm.id, granularity).then(vmStats => {
          vmsStats[vm.id] = {
            nPoints: vmStats.stats.cpus?.['0']?.length ?? 0,
            stats: vmStats.stats,
            averages: {},
          }
        })
      )
    )

    return vmsStats
  }

  async _getVmsAverages(vms: XoVm[], hosts: Record<string, XoHost>): Promise<HostAveragesMap> {
    const vmsStats = await this._getVmsStats(vms, 'minutes')
    const vmsAverages = computeResourcesAverageWithWeight(
      computeResourcesAverage(vms, vmsStats, EXECUTION_DELAY),
      computeResourcesAverage(vms, vmsStats, MINUTES_OF_HISTORICAL_DATA),
      0.75
    )

    // Compute real CPU usage. Virtuals cpus to reals cpus.
    for (const [hostId, hostVms] of Object.entries(groupBy(vms, '$container'))) {
      const host = hosts[hostId]
      if (host !== undefined) {
        setRealCpuAverageOfVms(hostVms, vmsAverages, Number(host.CPUs['cpu_count'] ?? '1'))
      }
    }

    return vmsAverages
  }

  // ===================================================================
  // vCPU pre-positioning helpers
  // ===================================================================

  async _processVcpuPrepositioning(hosts: XoHost[]): Promise<PromiseSettledResult<unknown>[] | undefined> {
    const promises: Promise<void>[] = []

    // removing hosts which have incorrect cpu count value to avoid mass migration on rrd malfunction
    const sanitizedHostList = hosts.filter(host => (host.cpus.cores ?? 0) > 0)
    if (sanitizedHostList.length < hosts.length) {
      const unhealthyHosts = hosts.filter(host => !host.cpus.cores)
      for (const unhealthyHost of unhealthyHosts) {
        warn(
          `vCPU balancing: host ${unhealthyHost.id} has unexpected CPU value: ${inspect(unhealthyHost.cpus, { depth: null })}`
        )
      }
      if (sanitizedHostList.length < 2) {
        // need at least 2 hosts
        return
      }
    }
    const idToHost = keyBy(sanitizedHostList, 'id')
    const allVms = filter(this._getAllRunningVms(), vm => vm.$container in idToHost)
    const hostList = this._getVCPUHosts(sanitizedHostList, allVms)
    const idealVcpuPerCpuRatio =
      hostList.reduce((sum, host) => sum + host.vcpuCount, 0) / hostList.reduce((sum, host) => sum + host.cpuCount, 0)

    debugVcpuBalancing('Trying to apply vCPU prepositioning.')
    debugVcpuBalancing(`vCPU count per host: ${inspect(hostList, { depth: null })}`)
    debugVcpuBalancing(`Average vCPUs per CPU: ${idealVcpuPerCpuRatio}`)

    // execute prepositioning only if vCPU/CPU ratios are different enough, to prevent executing too often
    const minHost = minBy(hostList, vcpuPerCpuRatio)
    const maxHost = maxBy(hostList, vcpuPerCpuRatio)
    if (minHost === undefined || maxHost === undefined) {
      return
    }
    const ratio = vcpuPerCpuRatio(minHost) / vcpuPerCpuRatio(maxHost)
    if (ratio > THRESHOLD_VCPU_RATIO) {
      debugVcpuBalancing(`vCPU ratios not different enough: ${ratio}`)
      return
    }

    // execute prepositioning only if the pool is not loaded too much
    const result = await this._getHostStatsAverages({ hosts })
    if (result === undefined) {
      return
    }
    const { averages: hostsAverages } = result
    const poolAverageCpu = computeAverageCpu(hostsAverages)
    if (poolAverageCpu > THRESHOLD_POOL_CPU) {
      debugVcpuBalancing(`Pool too much loaded for vCPU prepositioning: ${poolAverageCpu}% CPU used`)
      return
    }
    const vmsAverages = await this._getVmsAverages(allVms, idToHost)

    // 1. Find source host from which to migrate.
    const sources = sortBy(
      // filter to only get hosts for which removing vCPUs is meaningful
      filter(
        hostList,
        host =>
          (host.vcpuCount - VCPU_NUMBER_TOLERANCE) / host.cpuCount >= idealVcpuPerCpuRatio &&
          host.vcpuCount > host.cpuCount
      ),
      [
        (host: VcpuHost) => -vcpuPerCpuRatio(host),
        (host: VcpuHost) => (hostsAverages[host.id] ?? { memoryFree: 0 }).memoryFree,
      ]
    )
    debugVcpuBalancing(`Sources: ${inspect(sources, { depth: null })}`)

    for (const sourceHost of sources) {
      // calculating how many vCPUs source should give
      let deltaSource = sourceHost.vcpuCount - sourceHost.cpuCount * idealVcpuPerCpuRatio
      // go to the next host if this one is close enough to ideal vCPU/CPU ratio
      if (deltaSource < VCPU_NUMBER_TOLERANCE) {
        continue
      }

      // 2. Find destination host.
      const destinations = sortBy(
        // not subtracting VCPU_NUMBER_TOLERANCE to host.vcpuCount, to avoid situations where an overloaded host can't find a destination
        filter(hostList, host => host.id !== sourceHost.id && host.vcpuCount / host.cpuCount < idealVcpuPerCpuRatio),
        [
          // trying to avoid migrations between pools
          (host: VcpuHost) => host.poolId === sourceHost.poolId,
          vcpuPerCpuRatio,
          (host: VcpuHost) => -(hostsAverages[host.id] ?? { memoryFree: 0 }).memoryFree,
        ]
      )
      debugVcpuBalancing(`Destinations: ${inspect(destinations, { depth: null })}`)

      if (!destinations.length) {
        continue // Cannot find a valid destination.
      }

      // Build VM list to migrate.
      let sourceVms = Object.values(sourceHost.vms)

      // eslint-disable-next-line no-labels
      destinationLoop: for (const destinationHost of destinations) {
        debugVcpuBalancing(`Host candidate: ${sourceHost.id} -> ${destinationHost.id}`)

        const destAverages = hostsAverages[destinationHost.id] ?? { cpu: 0, memoryFree: 0, nCpus: 0, memory: 0 }

        // calculating how many vCPUs destination should accept
        let deltaDestination = destinationHost.vcpuCount - destinationHost.cpuCount * idealVcpuPerCpuRatio

        if (
          deltaDestination >= 0 ||
          destAverages.cpu > this._thresholds.cpu.low ||
          destAverages.memoryFree < this._thresholds.memoryFree.low
        ) {
          continue
        }

        let delta = Math.ceil(Math.min(deltaSource, -deltaDestination))
        const vms = sortBy(
          filter(
            sourceVms,
            vm =>
              !this._isVmInCooldown(vm) &&
              destAverages.memoryFree >= (vmsAverages[vm.id] ?? { memory: 0 }).memory &&
              vm.CPUs.number <= delta
          ),
          [(vm: XoVm) => -vm.CPUs.number]
        )

        for (const vm of vms) {
          const vmAverages = vmsAverages[vm.id] ?? { cpu: 0, memory: 0, nCpus: 0, memoryFree: 0 }

          if (
            vm.CPUs.number <= delta &&
            destAverages.cpu + vmAverages.cpu < this._thresholds.cpu.low &&
            destAverages.memoryFree - vmAverages.memory > this._thresholds.memoryFree.low
          ) {
            const source = idToHost[sourceHost.id]
            const destination = idToHost[destinationHost.id]
            if (source === undefined || destination === undefined) {
              continue
            }
            debugVcpuBalancing(
              `Migrate VM (${vm.id} "${vm.name_label}") with ${vm.CPUs.number} vCPU to Host (${destinationHost.id} "${destination.name_label}") from Host (${sourceHost.id} "${source.name_label}").`
            )
            // 3. Update tags and averages.
            sourceHost.vcpuCount -= vm.CPUs.number
            destinationHost.vcpuCount += vm.CPUs.number

            destAverages.cpu += vmAverages.cpu
            destAverages.memoryFree -= vmAverages.memory

            // Updating VM array to avoiding migrating the same VM twice
            delete sourceHost.vms[vm.id]
            sourceVms = Object.values(sourceHost.vms)

            // 4. Migrate.
            promises.push(this._migrateVm(vm, this.xo.getXapi(source), this.xo.getXapi(destination), destination.id))
            debugVcpuBalancing(`vCPU count per host: ${inspect(hostList, { depth: null })}`)

            // 5. Check if source host is still overloaded and if destination host is still underloaded
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
    return Promise.allSettled(promises)
  }

  _getVCPUHosts(hosts: XoHost[], vms: XoVm[]): (VcpuHost & { poolId: XoPool['id'] })[] {
    const idToHost: Record<string, VcpuHost & { poolId: XoPool['id'] }> = {}
    for (const host of hosts) {
      const taggedHost = (idToHost[host.id] = {
        id: host.id,
        poolId: host.$poolId,
        cpuCount: parseInt(host.CPUs['cpu_count'] ?? '0', 10),
        vcpuCount: 0,
        vms: {},
      })

      // Hide properties when util.inspect is used.
      Object.defineProperties(taggedHost, {
        poolId: { enumerable: false },
        vms: { enumerable: false },
      })
    }

    for (const vm of vms) {
      const hostId = vm.$container as string
      if (!(hostId in idToHost)) {
        continue
      }

      const host = idToHost[hostId]!
      host.vcpuCount += vm.CPUs.number

      if (
        vm.xentools &&
        vm.tags.every(tag => !this._antiAffinityTags.includes(tag) && !this._affinityTags.includes(tag))
      ) {
        host.vms[vm.id] = vm
      }
    }

    return Object.values(idToHost)
  }

  // ===================================================================
  // Anti-affinity helpers
  // ===================================================================

  async _processAntiAffinity(): Promise<void> {
    if (!this._antiAffinityTags.length) {
      return
    }

    const allHosts = this._getHosts()
    if (allHosts.length <= 1) {
      return
    }
    const idToHost = keyBy(allHosts, 'id')

    const allVms = filter(this._getAllRunningVms(), vm => vm.$container in idToHost)
    const taggedHosts = this._getTaggedHosts({ hosts: allHosts, tagList: this._antiAffinityTags, vms: allVms })

    // 1. Check if we must migrate VMs...
    const tagsDiff: Record<string, number> = {}
    for (const watchedTag of this._antiAffinityTags) {
      const getCount = (fn: typeof maxBy) => fn(taggedHosts.hosts, host => host.tags[watchedTag])?.tags[watchedTag] ?? 0
      const diff = getCount(maxBy) - getCount(minBy)
      if (diff > 1) {
        tagsDiff[watchedTag] = diff - 1
      }
    }
    if (isEmpty(tagsDiff)) {
      return
    }

    // 2. Migrate!
    debugAntiAffinity('Try to apply anti-affinity policy.')
    debugAntiAffinity(`VM tag count per host: ${inspect(taggedHosts, { depth: null })}.`)
    debugAntiAffinity(`Tags diff: ${inspect(tagsDiff, { depth: null })}.`)

    const vmsAverages = await this._getVmsAverages(allVms, idToHost)
    const result = await this._getHostStatsAverages({ hosts: allHosts })
    if (result === undefined) {
      return
    }
    const { averages: hostsAverages } = result

    debugAntiAffinity(`Hosts averages: ${inspect(hostsAverages, { depth: null })}.`)

    const promises: Promise<void>[] = []
    for (const tag in tagsDiff) {
      promises.push(...this._processAntiAffinityTag({ tag, vmsAverages, hostsAverages, taggedHosts, idToHost }))
    }

    // 3. Done!
    debugAntiAffinity(`VM tag count per host after migration: ${inspect(taggedHosts, { depth: null })}.`)
    await Promise.all(promises)
  }

  _processAntiAffinityTag({
    tag,
    vmsAverages,
    hostsAverages,
    taggedHosts,
    idToHost,
  }: {
    tag: string
    vmsAverages: HostAveragesMap
    hostsAverages: HostAveragesMap
    taggedHosts: TaggedHostsResult
    idToHost: Record<string, XoHost>
  }): Promise<void>[] {
    const promises: Promise<void>[] = []

    while (true) {
      // safety to prevent infinite loop if destination has no VM able to migrate
      let emptyLoop = true
      // 1. Find source host from which to migrate.
      const sources = sortBy(
        filter(taggedHosts.hosts, host => (host.tags[tag] ?? 0) > 1),
        [
          (host: TaggedHost) => host.tags[tag],
          // Find host with the most memory used. Don't forget the "-". ;)
          (host: TaggedHost) => -(hostsAverages[host.id] ?? { memoryFree: 0 }).memoryFree,
        ]
      )

      for (let sourceIndex = sources.length; sourceIndex >= 0; --sourceIndex) {
        if (sourceIndex === 0) {
          return promises // Nothing to migrate or we can't.
        }

        const sourceHost = sources[sourceIndex - 1]!

        // 2. Find destination host.
        const destinations = sortBy(
          filter(
            taggedHosts.hosts,
            host => host.id !== sourceHost.id && (host.tags[tag] ?? 0) + 1 < (sourceHost.tags[tag] ?? 0)
          ),
          [
            (host: TaggedHost) => host.tags[tag],
            // Ideally it would be interesting to migrate in the same pool.
            (host: TaggedHost) => host.poolId !== sourceHost.poolId,
            // Find host with the least memory used. Don't forget the "-". ;)
            (host: TaggedHost) => -(hostsAverages[host.id] ?? { memoryFree: 0 }).memoryFree,
          ]
        )
        if (!destinations.length) {
          return promises // Cannot find a valid destination.
        }

        // Build VM list to migrate.
        // We try to migrate VMs with the targeted tag.
        const sourceVms = filter(sourceHost.vms, vm => vm.tags.includes(tag))

        let destinationHost: TaggedHost | undefined
        let vm: XoVm | undefined
        for (const destination of destinations) {
          destinationHost = destination
          debugAntiAffinity(`Host candidate: ${sourceHost.id} -> ${destinationHost.id}.`)

          const destAverages = hostsAverages[destinationHost.id] ?? { cpu: 0, memoryFree: 0, nCpus: 0, memory: 0 }

          const vms = filter(
            sourceVms,
            v =>
              !this._isVmInCooldown(v) &&
              destAverages.memoryFree >= (vmsAverages[v.id] ?? { memory: 0 }).memory &&
              v.tags.every(t => !this._affinityTags.includes(t))
          )

          debugAntiAffinity(
            `Tagged VM ("${tag}") candidates to migrate from host ${sourceHost.id}: ${inspect(mapToArray(vms, 'id'))}.`
          )
          vm = this._getAntiAffinityVmToMigrate({
            vms,
            vmsAverages,
            hostsAverages,
            taggedHosts,
            sourceHost,
            destinationHost,
          })
          if (vm) {
            break
          }
        }

        if (!vm || !destinationHost) {
          continue // If we can't find a VM to migrate, we must try with another source!
        }

        const source = idToHost[sourceHost.id]
        const destination = idToHost[destinationHost.id]
        if (source === undefined || destination === undefined) {
          continue
        }
        debugAntiAffinity(
          `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destinationHost.id} "${destination.name_label}") from Host (${sourceHost.id} "${source.name_label}").`
        )

        // 3. Update tags and averages.
        // This update can change the source host for the next migration.
        for (const t of vm.tags) {
          if (this._antiAffinityTags.includes(t)) {
            sourceHost.tags[t] = (sourceHost.tags[t] ?? 0) - 1
            destinationHost.tags[t] = (destinationHost.tags[t] ?? 0) + 1
          }
        }

        const destAverages = hostsAverages[destinationHost.id] ?? { cpu: 0, memoryFree: 0, nCpus: 0, memory: 0 }
        const vmAverages = vmsAverages[vm.id] ?? { cpu: 0, memory: 0, nCpus: 0, memoryFree: 0 }

        destAverages.cpu += vmAverages.cpu
        destAverages.memoryFree -= vmAverages.memory

        delete sourceHost.vms[vm.id]

        // 4. Migrate.
        promises.push(this._migrateVm(vm, this.xo.getXapi(source), this.xo.getXapi(destination), destination.id))
        emptyLoop = false

        break // Continue with the same tag, the source can be different.
      }

      if (emptyLoop) {
        break
      }
    }

    return promises
  }

  _getTaggedHosts({
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
    const tagCount: Record<string, number> = {}
    for (const tag of tagList) {
      tagCount[tag] = 0
    }

    const taggedHosts: Record<string, TaggedHost> = {}
    for (const host of hosts) {
      const tags: Record<string, number> = {}
      for (const tag of tagList) {
        tags[tag] = 0
      }

      const taggedHost = (taggedHosts[host.id] = {
        id: host.id,
        poolId: host.$poolId,
        tags,
        vms: {},
      })

      // Hide properties when util.inspect is used.
      Object.defineProperties(taggedHost, {
        poolId: { enumerable: false },
        vms: { enumerable: false },
      })
    }

    for (const vm of vms) {
      const hostId = vm.$container as string
      if (!(hostId in taggedHosts)) {
        continue
      }

      const taggedHost = taggedHosts[hostId]!

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

    return { tagCount, hosts: Object.values(taggedHosts) }
  }

  _computeAntiAffinityVariance(taggedHosts: TaggedHostsResult): number {
    // See: https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance
    let variance = 0

    const { hosts } = taggedHosts
    for (const tag in taggedHosts.tagCount) {
      const firstHost = hosts[0]
      const k = firstHost?.tags[tag] ?? 0

      let ex = 0
      let ex2 = 0

      for (const host of hosts) {
        const x = host.tags[tag] ?? 0
        const diff = x - k
        ex += diff
        ex2 += diff * diff
      }

      const n = hosts.length
      variance += (ex2 - (ex * ex) / n) / n
    }

    return variance
  }

  _getAntiAffinityVmToMigrate({
    vms,
    vmsAverages: _vmsAverages,
    hostsAverages: _hostsAverages,
    taggedHosts,
    sourceHost,
    destinationHost,
  }: {
    vms: XoVm[]
    vmsAverages: HostAveragesMap
    hostsAverages: HostAveragesMap
    taggedHosts: TaggedHostsResult
    sourceHost: TaggedHost
    destinationHost: TaggedHost
  }): XoVm | undefined {
    let bestVariance = this._computeAntiAffinityVariance(taggedHosts)
    let bestVm: XoVm | undefined

    for (const vm of vms) {
      const vmTags = filter(vm.tags, tag => this._antiAffinityTags.includes(tag))

      for (const tag of vmTags) {
        sourceHost.tags[tag] = (sourceHost.tags[tag] ?? 0) - 1
        destinationHost.tags[tag] = (destinationHost.tags[tag] ?? 0) + 1
      }

      const variance = this._computeAntiAffinityVariance(taggedHosts)

      for (const tag of vmTags) {
        sourceHost.tags[tag] = (sourceHost.tags[tag] ?? 0) + 1
        destinationHost.tags[tag] = (destinationHost.tags[tag] ?? 0) - 1
      }

      if (variance < bestVariance) {
        if (vm.xentools) {
          bestVariance = variance
          bestVm = vm
        } else {
          debugAntiAffinity(`VM (${vm.id}) of Host (${sourceHost.id}) does not support pool migration.`)
        }
      }
    }

    return bestVm
  }

  // ===================================================================
  // Affinity helpers
  // ===================================================================

  async _processAffinity(): Promise<void> {
    if (!this._affinityTags.length) {
      return
    }

    const allHosts = this._getHosts()
    if (allHosts.length <= 1) {
      return
    }
    const idToHost = keyBy(allHosts, 'id')

    const allVms = filter(this._getAllRunningVms(), vm => vm.$container in idToHost)
    const taggedHosts = this._getTaggedHosts({
      hosts: allHosts,
      tagList: this._affinityTags,
      vms: allVms,
      includeUntaggedVms: true,
    })

    // 1. Check if we must migrate VMs...
    const spreadTags: string[] = []
    for (const watchedTag of this._affinityTags) {
      const taggedHostCount = taggedHosts.hosts.reduce(
        (accumulator, host) => accumulator + ((host.tags[watchedTag] ?? 0) > 0 ? 1 : 0),
        0
      )
      if (taggedHostCount > 1) {
        spreadTags.push(watchedTag)
      }
    }
    if (spreadTags.length === 0) {
      return
    }

    // 2. Check for tag coalitions
    const coalitions = this._computeCoalitions(allVms, this._affinityTags)
    const coalitionExample = Object.values(coalitions).find(coalition => coalition.length > 1)
    if (coalitionExample !== undefined) {
      warn(`affinity: Some VMs have multiple affinity tags, this should be avoided: ${inspect(coalitionExample)}`)
      debugAffinity(`Tag coalitions: ${inspect(coalitions, { depth: null })}`)
    }

    // 3. Migrate!
    debugAffinity('Try to apply affinity policy.')
    debugAffinity(`VM tag count per host: ${inspect(taggedHosts, { depth: null })}.`)
    debugAffinity(`Spread tags: ${inspect(spreadTags, { depth: null })}.`)

    const vmsAverages = await this._getVmsAverages(allVms, idToHost)
    const result = await this._getHostStatsAverages({ hosts: allHosts })
    if (result === undefined) {
      return
    }
    const { averages: hostsAverages } = result

    debugAffinity(`Hosts averages: ${inspect(hostsAverages, { depth: null })}.`)

    const promises: Promise<void>[] = []
    const alreadyProcessed = new Set<string>() // processed with another tag of its coalition
    for (const tag of spreadTags) {
      if (!alreadyProcessed.has(tag)) {
        promises.push(
          ...(await this._processAffinityTag({
            tag,
            vmsAverages,
            hostsAverages,
            taggedHosts,
            idToHost,
            coalition: coalitions[tag] ?? [tag],
          }))
        )
        ;(coalitions[tag] ?? [tag]).forEach(coalitionTag => {
          alreadyProcessed.add(coalitionTag)
        })
      }
    }

    // 4. Done!
    debugAffinity(`VM tag count per host after migration: ${inspect(taggedHosts, { depth: null })}`)
    await Promise.allSettled(promises)
  }

  async _processAffinityTag({
    tag,
    vmsAverages,
    hostsAverages,
    taggedHosts,
    idToHost,
    coalition,
  }: {
    tag: string
    vmsAverages: HostAveragesMap
    hostsAverages: HostAveragesMap
    taggedHosts: TaggedHostsResult
    idToHost: Record<string, XoHost>
    coalition: string[]
  }): Promise<Promise<void>[]> {
    debugAffinity(`Processing tag ${tag} (coalition: ${coalition})`)
    const promises: Promise<void>[] = []

    const taggedVmCountPerHost: Record<string, number> = {}
    for (const host of taggedHosts.hosts) {
      taggedVmCountPerHost[host.id] = coalition.reduce((sum, coalitionTag) => sum + (host.tags[coalitionTag] ?? 0), 0)
    }

    const sortedHosts = sortBy(
      taggedHosts.hosts.filter(host => coalition.some(coalitionTag => (host.tags[coalitionTag] ?? 0) > 0)),
      [
        (host: TaggedHost) => taggedVmCountPerHost[host.id],
        (host: TaggedHost) => -(hostsAverages[host.id] ?? { memoryFree: 0 }).memoryFree,
      ]
    )

    let destinationHost = sortedHosts.pop()
    if (destinationHost === undefined) {
      return promises
    }

    for (const sourceHost of sortedHosts) {
      debugAffinity(
        `Host candidate: ${sourceHost.id}(${idToHost[sourceHost.id]?.name_label}) -> ${destinationHost.id}(${idToHost[destinationHost.id]?.name_label}).`
      )
      const sourceVms = Object.values(sourceHost.vms).filter(
        vm => !!vm.xentools && !this._isVmInCooldown(vm) && intersection(vm.tags, coalition).length > 0
      )

      debugAffinity(`VMs to migrate: ${sourceVms.map(vm => vm.name_label)}`)

      for (const vm of sourceVms) {
        const destHostAverages = () =>
          hostsAverages[destinationHost!.id] ?? { memoryFree: 0, cpu: 0, nCpus: 0, memory: 0 }

        let loopCountdown = sortedHosts.length
        while (
          destHostAverages().memoryFree - (vmsAverages[vm.id] ?? { memory: 0 }).memory <
          this._thresholds.memoryFree.critical
        ) {
          loopCountdown--
          debugAffinity(`Host ${sourceHost.id} is overcrowded`)
          // A) migrate other VMs to try to free some memory on destination host
          const { promises: otherMigrationPromises, success } = await this._migrateOtherVms({
            crowdedHost: destinationHost!,
            hostsAverages,
            vmsAverages,
            idToHost,
            taggedHosts,
            memoryNeeded: (vmsAverages[vm.id] ?? { memory: 0 }).memory,
          })
          promises.push(...otherMigrationPromises)

          // B) if we can't do A), change the destination
          if (!success) {
            debugAffinity(
              `Host ${sourceHost.id} does not have enough memory to get all "${tag}" tagged VMs (or its coalition)`
            )
            if (sourceHost === sortedHosts[sortedHosts.length - 1]) {
              warn(`affinity: Can't satisfy ${tag} affinity constraints (or its coalition)`)
              return promises
            }
            destinationHost = sortedHosts.pop()
            if (destinationHost === undefined) {
              return promises
            }
          }
          if (loopCountdown < 0) {
            warn(`affinity: Broke out of potential infinite loop. This should not have happened.`)
            break
          }
        }

        const destXoHost = idToHost[destinationHost.id]
        const srcXoHost = idToHost[sourceHost.id]
        if (destXoHost === undefined || srcXoHost === undefined) {
          continue
        }

        promises.push(
          this._migrateVmAndUpdateInfos({
            destination: destXoHost,
            source: srcXoHost,
            sourceHost,
            destinationHost,
            vm,
            hostsAverages,
            vmAverages: vmsAverages[vm.id] ?? { cpu: 0, memory: 0, nCpus: 0, memoryFree: 0 },
          })
        )
      }
    }
    return promises
  }

  async _migrateOtherVms({
    crowdedHost,
    hostsAverages,
    vmsAverages,
    idToHost,
    taggedHosts,
    memoryNeeded,
  }: {
    crowdedHost: TaggedHost
    hostsAverages: HostAveragesMap
    vmsAverages: HostAveragesMap
    idToHost: Record<string, XoHost>
    taggedHosts: TaggedHostsResult
    memoryNeeded: number
  }): Promise<{ promises: Promise<void>[]; success: boolean }> {
    const promises: Promise<void>[] = []

    const candidateVms = Object.values(crowdedHost.vms)
      .filter(
        vm =>
          !!vm.xentools &&
          !this._isVmInCooldown(vm) &&
          intersection(vm.tags, this._affinityTags).length === 0 &&
          intersection(vm.tags, this._antiAffinityTags).length === 0
      )
      .sort((a, b) => (vmsAverages[b.id]?.memory ?? 0) - (vmsAverages[a.id]?.memory ?? 0)) // try to migrate bigger VMs first
    debugAffinity(`Candidate VMs to be moved away: ${candidateVms.map(vm => vm.name_label)}`)

    for (const vm of candidateVms) {
      const vmAverages = vmsAverages[vm.id] ?? { cpu: 0, memory: 0, nCpus: 0, memoryFree: 0 }

      const destinationHost = sortBy(taggedHosts.hosts, [
        (host: TaggedHost) => -(hostsAverages[host.id] ?? { memoryFree: 0 }).memoryFree,
        (host: TaggedHost) => (hostsAverages[host.id] ?? { cpu: 0 }).cpu,
      ]).find(host => {
        if (host.id === crowdedHost.id) {
          return false
        }
        const destinationAverages = hostsAverages[host.id] ?? { cpu: 0, memoryFree: 0, nCpus: 0, memory: 0 }
        return (
          destinationAverages.cpu + vmAverages.cpu <= this._thresholds.cpu.critical &&
          destinationAverages.memoryFree - vmAverages.memory >= this._thresholds.memoryFree.critical
        )
      })

      if (destinationHost === undefined) {
        debug(`Cannot migrate VM (${vm.id}) to any host. VM requires ${vmAverages.memory}MB, CPU: ${vmAverages.cpu}%`)
        continue
      }

      const destXoHost = idToHost[destinationHost.id]
      const srcXoHost = idToHost[crowdedHost.id]
      if (destXoHost === undefined || srcXoHost === undefined) {
        continue
      }

      promises.push(
        this._migrateVmAndUpdateInfos({
          destination: destXoHost,
          source: srcXoHost,
          sourceHost: crowdedHost,
          destinationHost,
          vm,
          hostsAverages,
          vmAverages,
        })
      )

      const crowdedAverages = hostsAverages[crowdedHost.id] ?? { memoryFree: 0, cpu: 0, nCpus: 0, memory: 0 }
      if (crowdedAverages.memoryFree - memoryNeeded > this._thresholds.memoryFree.critical) {
        return { promises, success: true }
      }
    }

    return { promises, success: false }
  }

  _migrateVmAndUpdateInfos({
    destination,
    source,
    sourceHost,
    destinationHost,
    vm,
    hostsAverages,
    vmAverages,
  }: {
    destination: XoHost
    source: XoHost
    sourceHost: TaggedHost
    destinationHost: TaggedHost
    vm: XoVm
    hostsAverages: HostAveragesMap
    vmAverages: ResourceAverages
  }): Promise<void> {
    debugAffinity(
      `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destination.id} "${destination.name_label}") from Host (${source.id} "${source.name_label}").`
    )

    for (const tag of vm.tags) {
      if (this._affinityTags.includes(tag)) {
        sourceHost.tags[tag] = (sourceHost.tags[tag] ?? 0) - 1
        destinationHost.tags[tag] = (destinationHost.tags[tag] ?? 0) + 1
      }
    }

    const sourceAverages = hostsAverages[source.id] ?? { cpu: 0, memoryFree: 0, nCpus: 0, memory: 0 }
    const destinationAverages = hostsAverages[destination.id] ?? { cpu: 0, memoryFree: 0, nCpus: 0, memory: 0 }

    sourceAverages.cpu -= vmAverages.cpu
    destinationAverages.cpu += vmAverages.cpu

    sourceAverages.memoryFree += vmAverages.memory
    destinationAverages.memoryFree -= vmAverages.memory

    // Updating VM array to avoiding migrating the same VM twice
    delete sourceHost.vms[vm.id]

    return this._migrateVm(vm, this.xo.getXapi(source), this.xo.getXapi(destination), destination.id)
  }

  // Check if VM was recently migrated and is in cooldown period
  _isVmInCooldown(vm: XoVm): boolean {
    const { migrationCooldown, migrationHistory } = this._globalOptions
    if (migrationCooldown > 0) {
      const lastMigration = migrationHistory.get(vm.id)
      if (lastMigration !== undefined && Date.now() - lastMigration < migrationCooldown) {
        return true
      }
    }
    return false
  }

  _migrateVm(vm: XoVm, _xapiSrc: Xapi, xapiDest: Xapi, destHostId: XoHost['id']): Promise<void> {
    if (this._dryRunResult !== undefined) {
      this._dryRunResult.set(vm.id, destHostId)
      return Promise.resolve()
    }
    const { migrationHistory } = this._globalOptions
    return (
      this._concurrentMigrationLimiter.call(_xapiSrc, 'migrateVm', vm.id, xapiDest, destHostId) as Promise<void>
    ).then(() => {
      migrationHistory.set(vm.id, Date.now())
    })
  }

  _computeCoalitions(vms: { tags: string[] }[], affinityTags: string[]): Record<string, string[]> {
    const coalitions: Record<string, Set<string>> = {}
    for (const tag of affinityTags) {
      coalitions[tag] = new Set([tag])
    }
    for (const vm of vms) {
      const vmAffinityTags = intersection(vm.tags, affinityTags)
      if (vmAffinityTags.length > 1) {
        for (const tag1 of vmAffinityTags) {
          for (const tag2 of vmAffinityTags) {
            coalitions[tag1]?.add(tag2)
          }
        }
      }
    }

    for (const coalitionSet of Object.values(coalitions)) {
      coalitionSet.forEach(coalitionTag => {
        coalitions[coalitionTag]?.forEach(neighbourTag => {
          coalitionSet.add(neighbourTag)
        })
      })
    }

    const result: Record<string, string[]> = {}
    for (const [tag, set] of Object.entries(coalitions)) {
      result[tag] = Array.from(set)
    }

    return result
  }
}
