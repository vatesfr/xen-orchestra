import lodash from 'lodash'
const { filter, groupBy, includes, intersection, isEmpty, keyBy, map: mapToArray, maxBy, minBy, sortBy } = lodash
import { inspect } from 'util'

import {
  EXECUTION_DELAY,
  debug,
  warn,
  computeAverageCpu,
  computeResourcesAverage,
  computeResourcesAverageWithWeight,
  setRealCpuAverageOfVms,
  type ResourceAverages,
} from './utils.js'

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
const VCPU_NUMBER_TOLERANCE = 1
const THRESHOLD_POOL_CPU = 40

const numberOrDefault = (value: number | undefined | null, def: number): number =>
  value != null && value >= 0 ? value : def

export const debugAffinity = (str: string) => debug(`affinity: ${str}`)
export const debugAntiAffinity = (str: string) => debug(`anti-affinity: ${str}`)
export const debugVcpuBalancing = (str: string) => debug(`vCPU balancing: ${str}`)

// ===================================================================

export interface Host {
  id: string
  type: 'host'
  $poolId: string
  power_state: string
  powerOnMode: string
  name_label: string
  CPUs: { cpu_count: number | string }
  cpus: { cores: number }
  _xapiId: string
}

export interface Vm {
  id: string
  type: string
  $poolId: string
  $container: string
  power_state: string
  name_label: string
  tags: string[]
  xenTools: boolean
  CPUs: { number: number }
  _xapiId: string
}

export interface Pool {
  id: string
  type: string
  master: string
  name_label: string
}

export interface Xapi {
  migrateVm(vmXapiId: string, destXapi: Xapi, destHostXapiId: string): Promise<void>
  assertCanMigrateVm(vmXapiId: string, destHostXapiId: string): Promise<void>
  shutdownHost(hostId: string): Promise<void>
  powerOnHost(hostId: string): Promise<void>
}

export interface Xo {
  getObjects(): Record<string, Host | Vm | Pool | Record<string, unknown>>
  getObject(id: string): Host | Vm | Pool | undefined
  getXapi(idOrObject: string | { id: string }): Xapi
  getXapiHostStats(
    host: Host,
    granularity: string
  ): Promise<{ stats: { cpus: number[][]; memoryFree: number[]; memory: number[] } }>
  getXapiVmStats(
    vm: Vm,
    granularity: string
  ): Promise<{ stats: { cpus: number[][]; memoryFree: number[]; memory: number[] } }>
}

export interface GlobalOptions {
  ignoredVmTags: Set<string>
  migrationCooldown: number
  migrationHistory: Map<string, number>
}

export interface ConcurrencyLimiter {
  call(obj: Xapi, method: string, ...args: unknown[]): Promise<unknown>
}

export interface PlanOptions {
  excludedHosts?: string[]
  thresholds?: { cpu?: number; memoryFree?: number }
  balanceVcpus?: false | 'preventive' | true
  affinityTags?: string[]
  antiAffinityTags?: string[]
}

export interface Thresholds {
  cpu: { critical: number; high: number; low: number }
  memoryFree: { critical: number; high: number; low: number }
}

// ===================================================================

export default class Plan {
  xo: Xo | undefined
  _name: string
  _poolIds: string[]
  _excludedHosts: string[] | undefined
  _thresholds: Thresholds
  _affinityTags: string[]
  _antiAffinityTags: string[]
  _performanceSubmode: string
  _globalOptions: GlobalOptions
  _concurrentMigrationLimiter: ConcurrencyLimiter

  constructor(
    xo: Xo | undefined,
    name: string,
    poolIds: string[],
    { excludedHosts, thresholds, balanceVcpus, affinityTags = [], antiAffinityTags = [] }: PlanOptions,
    globalOptions: GlobalOptions,
    concurrentMigrationLimiter: ConcurrencyLimiter
  ) {
    this.xo = xo
    this._name = name
    this._poolIds = poolIds
    this._excludedHosts = excludedHosts
    this._thresholds = {
      cpu: {
        critical: numberOrDefault(thresholds?.cpu, DEFAULT_CRITICAL_THRESHOLD_CPU),
        high: 0,
        low: 0,
      },
      memoryFree: {
        critical:
          numberOrDefault(thresholds?.memoryFree, DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE) * 1024 * 1024,
        high: 0,
        low: 0,
      },
    }
    this._affinityTags = affinityTags
    this._antiAffinityTags = antiAffinityTags
    this._performanceSubmode =
      balanceVcpus === false ? 'conservative' : balanceVcpus === true ? 'vCpuPrepositioning' : (balanceVcpus ?? 'conservative')
    this._globalOptions = globalOptions
    this._concurrentMigrationLimiter = concurrentMigrationLimiter

    for (const key of Object.keys(this._thresholds) as Array<keyof Thresholds>) {
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
    hosts: Host[]
    toOptimizeOnly?: boolean
    checkAverages?: boolean
  }): Promise<
    | {
        toOptimize: Host[] | undefined
        averages: Record<string, ResourceAverages>
        poolAverage?: number
      }
    | undefined
  > {
    const hostsStats = await this._getHostsStats(hosts, 'minutes')

    const avgNow = computeResourcesAverage(hosts, hostsStats, EXECUTION_DELAY)
    let toOptimize: Host[] | undefined
    if (toOptimizeOnly) {
      toOptimize = checkAverages
        ? this._checkResourcesAverages(hosts, avgNow, computeAverageCpu(avgNow))
        : this._checkResourcesThresholds(hosts, avgNow)
      if (toOptimize.length === 0) {
        debug('No hosts to optimize.')
        return undefined
      }
    }

    const avgBefore = computeResourcesAverage(hosts, hostsStats, MINUTES_OF_HISTORICAL_DATA)
    const avgWithRatio = computeResourcesAverageWithWeight(avgNow, avgBefore, 0.75)

    if (toOptimizeOnly) {
      toOptimize = checkAverages
        ? this._checkResourcesAverages(toOptimize!, avgWithRatio, computeAverageCpu(avgWithRatio))
        : this._checkResourcesThresholds(toOptimize!, avgWithRatio)
      if (toOptimize.length === 0) {
        debug('No hosts to optimize.')
        return undefined
      }
    }

    return {
      toOptimize,
      averages: avgWithRatio,
      ...(checkAverages && { poolAverage: computeAverageCpu(avgWithRatio) }),
    }
  }

  _checkResourcesThresholds(_objects: Host[], _averages: Record<string, ResourceAverages>): Host[] {
    throw new Error('Not implemented')
  }

  _checkResourcesAverages(objects: Host[], averages: Record<string, ResourceAverages>, poolAverage: number): Host[] {
    // Default implementation; overridden in PerformancePlan
    return []
  }

  // ===================================================================
  // Get objects.
  // ===================================================================

  _getPlanPools(): Record<string, Pool> {
    const pools: Record<string, Pool> = {}

    try {
      for (const poolId of this._poolIds) {
        pools[poolId] = this.xo!.getObject(poolId) as Pool
      }
    } catch (_) {
      return {}
    }

    return pools
  }

  _getHosts({ powerState = 'Running' } = {}): Host[] {
    return filter(
      this.xo!.getObjects(),
      (object): object is Host =>
        (object as Host).type === 'host' &&
        includes(this._poolIds, (object as Host).$poolId) &&
        (object as Host).power_state === powerState &&
        !includes(this._excludedHosts, (object as Host).id)
    ) as Host[]
  }

  _getAllRunningVms(): Vm[] {
    return filter(
      this.xo!.getObjects(),
      (object): object is Vm =>
        (object as Vm).type === 'VM' &&
        (object as Vm).power_state === 'Running' &&
        !(object as Vm).tags.some(tag => this._globalOptions.ignoredVmTags.has(tag))
    ) as Vm[]
  }

  // ===================================================================
  // Get stats.
  // ===================================================================

  async _getHostsStats(
    hosts: Host[],
    granularity: string
  ): Promise<Record<string, { nPoints: number; stats: { cpus: number[][]; memoryFree: number[]; memory: number[] }; averages: object }>> {
    const hostsStats: Record<string, { nPoints: number; stats: { cpus: number[][]; memoryFree: number[]; memory: number[] }; averages: object }> = {}

    await Promise.all(
      hosts.map(host =>
        this.xo!.getXapiHostStats(host, granularity).then(hostStats => {
          hostsStats[host.id] = {
            nPoints: hostStats.stats.cpus[0].length,
            stats: hostStats.stats,
            averages: {},
          }
        })
      )
    )

    return hostsStats
  }

  async _getVmsStats(
    vms: Vm[],
    granularity: string
  ): Promise<Record<string, { nPoints: number; stats: { cpus: number[][]; memoryFree: number[]; memory: number[] }; averages: object }>> {
    const vmsStats: Record<string, { nPoints: number; stats: { cpus: number[][]; memoryFree: number[]; memory: number[] }; averages: object }> = {}

    await Promise.all(
      vms.map(vm =>
        this.xo!.getXapiVmStats(vm, granularity).then(vmStats => {
          vmsStats[vm.id] = {
            nPoints: vmStats.stats.cpus[0].length,
            stats: vmStats.stats,
            averages: {},
          }
        })
      )
    )

    return vmsStats
  }

  async _getVmsAverages(vms: Vm[], hosts: Record<string, Host>): Promise<Record<string, ResourceAverages>> {
    const vmsStats = await this._getVmsStats(vms, 'minutes')
    const vmsAverages = computeResourcesAverageWithWeight(
      computeResourcesAverage(vms, vmsStats, EXECUTION_DELAY),
      computeResourcesAverage(vms, vmsStats, MINUTES_OF_HISTORICAL_DATA),
      0.75
    )

    for (const [hostId, hostVms] of Object.entries(groupBy(vms, '$container'))) {
      setRealCpuAverageOfVms(hostVms, vmsAverages, Number(hosts[hostId].CPUs.cpu_count))
    }

    return vmsAverages
  }

  // ===================================================================
  // vCPU pre-positioning helpers
  // ===================================================================

  async _processVcpuPrepositioning(hosts: Host[]): Promise<PromiseSettledResult<boolean>[]> {
    const promises: Promise<boolean>[] = []

    const sanitizedHostList = hosts.filter(host => host.cpus.cores > 0)
    if (sanitizedHostList.length < hosts.length) {
      const unhealthyHosts = hosts.filter(host => host.cpus.cores === undefined || host.cpus.cores === 0)
      for (const unhealthyHost of unhealthyHosts) {
        warn(
          `vCPU balancing: host ${unhealthyHost.id} has unexpected CPU value: ${inspect(unhealthyHost.cpus, { depth: null })}`
        )
      }
      if (sanitizedHostList.length < 2) {
        return []
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

    const ratio =
      vcpuPerCpuRatio(minBy(hostList, vcpuPerCpuRatio)!) / vcpuPerCpuRatio(maxBy(hostList, vcpuPerCpuRatio)!)
    if (ratio > THRESHOLD_VCPU_RATIO) {
      debugVcpuBalancing(`vCPU ratios not different enough: ${ratio}`)
      return []
    }

    const hostStatsResult = await this._getHostStatsAverages({ hosts })
    if (!hostStatsResult) return []
    const { averages: hostsAverages } = hostStatsResult
    const poolAverageCpu = computeAverageCpu(hostsAverages)
    if (poolAverageCpu > THRESHOLD_POOL_CPU) {
      debugVcpuBalancing(`Pool too much loaded for vCPU prepositioning: ${poolAverageCpu}% CPU used`)
      return []
    }
    const vmsAverages = await this._getVmsAverages(allVms, idToHost)

    const sources = sortBy(
      filter(
        hostList,
        host =>
          (host.vcpuCount - VCPU_NUMBER_TOLERANCE) / host.cpuCount >= idealVcpuPerCpuRatio &&
          host.vcpuCount > host.cpuCount
      ),
      [
        (host: VcpuHost) => -vcpuPerCpuRatio(host),
        (host: VcpuHost) => hostsAverages[host.id].memoryFree,
      ]
    )
    debugVcpuBalancing(`Sources: ${inspect(sources, { depth: null })}`)

    for (const sourceHost of sources) {
      let deltaSource = sourceHost.vcpuCount - sourceHost.cpuCount * idealVcpuPerCpuRatio
      if (deltaSource < VCPU_NUMBER_TOLERANCE) {
        continue
      }

      const destinations = sortBy(
        filter(hostList, host => host.id !== sourceHost.id && host.vcpuCount / host.cpuCount < idealVcpuPerCpuRatio),
        [
          (host: VcpuHost) => host.poolId === sourceHost.poolId,
          vcpuPerCpuRatio,
          (host: VcpuHost) => -hostsAverages[host.id].memoryFree,
        ]
      )
      debugVcpuBalancing(`Destinations: ${inspect(destinations, { depth: null })}`)

      if (!destinations.length) {
        continue
      }

      let sourceVms = Object.values(sourceHost.vms)

      // eslint-disable-next-line no-labels
      destinationLoop: for (const destinationHost of destinations) {
        debugVcpuBalancing(`Host candidate: ${sourceHost.id} -> ${destinationHost.id}`)

        let deltaDestination = destinationHost.vcpuCount - destinationHost.cpuCount * idealVcpuPerCpuRatio

        if (
          deltaDestination >= 0 ||
          hostsAverages[destinationHost.id].cpu > this._thresholds.cpu.low ||
          hostsAverages[destinationHost.id].memoryFree < this._thresholds.memoryFree.low
        ) {
          continue
        }

        let delta = Math.ceil(Math.min(deltaSource, -deltaDestination))
        const vms = sortBy(
          filter(
            sourceVms,
            vm =>
              !this._isVmInCooldown(vm) &&
              hostsAverages[destinationHost.id].memoryFree >= vmsAverages[vm.id].memory &&
              vm.CPUs.number <= delta
          ),
          [(vm: Vm) => -vm.CPUs.number]
        )

        for (const vm of vms) {
          if (
            vm.CPUs.number <= delta &&
            hostsAverages[destinationHost.id].cpu + vmsAverages[vm.id].cpu < this._thresholds.cpu.low &&
            hostsAverages[destinationHost.id].memoryFree - vmsAverages[vm.id].memory > this._thresholds.memoryFree.low
          ) {
            const source = idToHost[sourceHost.id]
            const destination = idToHost[destinationHost.id]
            debugVcpuBalancing(
              `Migrate VM (${vm.id} "${vm.name_label}") with ${vm.CPUs.number} vCPU to Host (${destinationHost.id} "${destination.name_label}") from Host (${sourceHost.id} "${source.name_label}").`
            )
            sourceHost.vcpuCount -= vm.CPUs.number
            destinationHost.vcpuCount += vm.CPUs.number

            const destinationAverages = hostsAverages[destinationHost.id]
            const vmAverages = vmsAverages[vm.id]

            destinationAverages.cpu += vmAverages.cpu
            destinationAverages.memoryFree -= vmAverages.memory

            delete sourceHost.vms[vm.id]
            sourceVms = Object.values(sourceHost.vms)

            promises.push(
              this._migrateVm(vm, this.xo!.getXapi(source), this.xo!.getXapi(destination), destination._xapiId)
            )
            debugVcpuBalancing(`vCPU count per host: ${inspect(hostList, { depth: null })}`)

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

  _getVCPUHosts(hosts: Host[], vms: Vm[]): VcpuHost[] {
    const idToHost: Record<string, VcpuHost> = {}
    for (const host of hosts) {
      const taggedHost = (idToHost[host.id] = {
        id: host.id,
        poolId: host.$poolId,
        cpuCount: parseInt(String(host.CPUs.cpu_count)),
        vcpuCount: 0,
        vms: {} as Record<string, Vm>,
      })

      Object.defineProperties(taggedHost, {
        poolId: { enumerable: false },
        vms: { enumerable: false },
      })
    }

    for (const vm of vms) {
      const hostId = vm.$container
      if (!(hostId in idToHost)) {
        continue
      }

      const host = idToHost[hostId]
      host.vcpuCount += vm.CPUs.number

      if (
        vm.xenTools &&
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

    const tagsDiff: Record<string, number> = {}
    for (const watchedTag of this._antiAffinityTags) {
      const getCount = (fn: typeof maxBy) => fn(taggedHosts.hosts, host => host.tags[watchedTag])!.tags[watchedTag]
      const diff = getCount(maxBy) - getCount(minBy)
      if (diff > 1) {
        tagsDiff[watchedTag] = diff - 1
      }
    }
    if (isEmpty(tagsDiff)) {
      return
    }

    debugAntiAffinity('Try to apply anti-affinity policy.')
    debugAntiAffinity(`VM tag count per host: ${inspect(taggedHosts, { depth: null })}.`)
    debugAntiAffinity(`Tags diff: ${inspect(tagsDiff, { depth: null })}.`)

    const vmsAverages = await this._getVmsAverages(allVms, idToHost)
    const hostStatsResult = await this._getHostStatsAverages({ hosts: allHosts })
    const hostsAverages = hostStatsResult?.averages ?? {}

    debugAntiAffinity(`Hosts averages: ${inspect(hostsAverages, { depth: null })}.`)

    const promises: Promise<boolean>[] = []
    for (const tag in tagsDiff) {
      promises.push(...this._processAntiAffinityTag({ tag, vmsAverages, hostsAverages, taggedHosts, idToHost }))
    }

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
    vmsAverages: Record<string, ResourceAverages>
    hostsAverages: Record<string, ResourceAverages>
    taggedHosts: TaggedHosts
    idToHost: Record<string, Host>
  }): Promise<boolean>[] {
    const promises: Promise<boolean>[] = []

    while (true) {
      let emptyLoop = true
      const sources = sortBy(
        filter(taggedHosts.hosts, host => host.tags[tag] > 1),
        [
          (host: TaggedHost) => host.tags[tag],
          (host: TaggedHost) => -hostsAverages[host.id].memoryFree,
        ]
      )

      for (let sourceIndex = sources.length; sourceIndex >= 0; --sourceIndex) {
        if (sourceIndex === 0) {
          return promises
        }

        const sourceHost = sources[sourceIndex - 1]

        const destinations = sortBy(
          filter(
            taggedHosts.hosts,
            host => host.id !== sourceHost.id && host.tags[tag] + 1 < sourceHost.tags[tag]
          ),
          [
            (host: TaggedHost) => host.tags[tag],
            (host: TaggedHost) => host.poolId !== sourceHost.poolId,
            (host: TaggedHost) => -hostsAverages[host.id].memoryFree,
          ]
        )
        if (!destinations.length) {
          return promises
        }

        const sourceVms = filter(sourceHost.vms, vm => vm.tags.includes(tag))

        let destinationHost: TaggedHost | undefined
        let vm: Vm | undefined
        for (const destination of destinations) {
          destinationHost = destination
          debugAntiAffinity(`Host candidate: ${sourceHost.id} -> ${destinationHost.id}.`)

          const vms = filter(
            sourceVms,
            vm =>
              !this._isVmInCooldown(vm) &&
              hostsAverages[destinationHost!.id].memoryFree >= vmsAverages[vm.id].memory &&
              vm.tags.every(tag => !this._affinityTags.includes(tag))
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

        if (!vm) {
          continue
        }

        const source = idToHost[sourceHost.id]
        const destination = idToHost[destinationHost!.id]
        debugAntiAffinity(
          `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destinationHost!.id} "${destination.name_label}") from Host (${sourceHost.id} "${source.name_label}").`
        )

        for (const vmTag of vm.tags) {
          if (this._antiAffinityTags.includes(vmTag)) {
            sourceHost.tags[vmTag]--
            destinationHost!.tags[vmTag]++
          }
        }

        const destinationAverages = hostsAverages[destinationHost!.id]
        const vmAverages = vmsAverages[vm.id]

        destinationAverages.cpu += vmAverages.cpu
        destinationAverages.memoryFree -= vmAverages.memory

        delete sourceHost.vms[vm.id]

        promises.push(
          this._migrateVm(vm, this.xo!.getXapi(source), this.xo!.getXapi(destination), destination._xapiId)
        )
        emptyLoop = false

        break
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
    hosts: Host[]
    tagList: string[]
    vms: Vm[]
    includeUntaggedVms?: boolean
  }): TaggedHosts {
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
        vms: {} as Record<string, Vm>,
      })

      Object.defineProperties(taggedHost, {
        poolId: { enumerable: false },
        vms: { enumerable: false },
      })
    }

    for (const vm of vms) {
      const hostId = vm.$container
      if (!(hostId in taggedHosts)) {
        continue
      }

      const taggedHost = taggedHosts[hostId]

      if (includeUntaggedVms) {
        taggedHost.vms[vm.id] = vm
      }
      for (const tag of vm.tags) {
        if (tagList.includes(tag)) {
          tagCount[tag]++
          taggedHost.tags[tag]++
          taggedHost.vms[vm.id] = vm
        }
      }
    }

    return { tagCount, hosts: Object.values(taggedHosts) }
  }

  _computeAntiAffinityVariance(taggedHosts: TaggedHosts): number {
    let variance = 0

    const { hosts } = taggedHosts
    for (const tag in taggedHosts.tagCount) {
      const k = hosts[0].tags[tag]

      let ex = 0
      let ex2 = 0

      for (const host of hosts) {
        const x = host.tags[tag]
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
    vmsAverages,
    hostsAverages,
    taggedHosts,
    sourceHost,
    destinationHost,
  }: {
    vms: Vm[]
    vmsAverages: Record<string, ResourceAverages>
    hostsAverages: Record<string, ResourceAverages>
    taggedHosts: TaggedHosts
    sourceHost: TaggedHost
    destinationHost: TaggedHost
  }): Vm | undefined {
    let bestVariance = this._computeAntiAffinityVariance(taggedHosts)
    let bestVm: Vm | undefined

    for (const vm of vms) {
      const vmTags = filter(vm.tags, tag => this._antiAffinityTags.includes(tag))

      for (const tag of vmTags) {
        sourceHost.tags[tag]--
        destinationHost.tags[tag]++
      }

      const variance = this._computeAntiAffinityVariance(taggedHosts)

      for (const tag of vmTags) {
        sourceHost.tags[tag]++
        destinationHost.tags[tag]--
      }

      if (variance < bestVariance) {
        if (vm.xenTools) {
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

    const spreadTags: string[] = []
    for (const watchedTag of this._affinityTags) {
      const taggedHostCount = taggedHosts.hosts.reduce(
        (accumulator, host) => accumulator + (host.tags[watchedTag] > 0 ? 1 : 0),
        0
      )
      if (taggedHostCount > 1) {
        spreadTags.push(watchedTag)
      }
    }
    if (spreadTags.length === 0) {
      return
    }

    const coalitions = this._computeCoalitions(allVms, this._affinityTags)
    const coalitionExample = Object.values(coalitions).find(coalition => coalition.length > 1)
    if (coalitionExample !== undefined) {
      warn(`affinity: Some VMs have multiple affinity tags, this should be avoided: ${inspect(coalitionExample)}`)
      debugAffinity(`Tag coalitions: ${inspect(coalitions, { depth: null })}`)
    }

    debugAffinity('Try to apply affinity policy.')
    debugAffinity(`VM tag count per host: ${inspect(taggedHosts, { depth: null })}.`)
    debugAffinity(`Spread tags: ${inspect(spreadTags, { depth: null })}.`)

    const vmsAverages = await this._getVmsAverages(allVms, idToHost)
    const hostStatsResult = await this._getHostStatsAverages({ hosts: allHosts })
    const hostsAverages = hostStatsResult?.averages ?? {}

    debugAffinity(`Hosts averages: ${inspect(hostsAverages, { depth: null })}.`)

    const promises: Promise<boolean>[] = []
    const alreadyProcessed = new Set<string>()
    for (const tag of spreadTags) {
      if (!alreadyProcessed.has(tag)) {
        promises.push(
          ...(await this._processAffinityTag({
            tag,
            vmsAverages,
            hostsAverages,
            taggedHosts,
            idToHost,
            coalition: coalitions[tag],
          }))
        )
        coalitions[tag].forEach(coalitionTag => {
          alreadyProcessed.add(coalitionTag)
        })
      }
    }

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
    vmsAverages: Record<string, ResourceAverages>
    hostsAverages: Record<string, ResourceAverages>
    taggedHosts: TaggedHosts
    idToHost: Record<string, Host>
    coalition: string[]
  }): Promise<Promise<boolean>[]> {
    debugAffinity(`Processing tag ${tag} (coalition: ${coalition})`)
    const promises: Promise<boolean>[] = []

    const taggedVmCountPerHost: Record<string, number> = {}
    for (const host of taggedHosts.hosts) {
      taggedVmCountPerHost[host.id] = coalition.reduce((sum, coalitionTag) => sum + host.tags[coalitionTag], 0)
    }

    const sortedHosts = sortBy(
      taggedHosts.hosts.filter(host => coalition.some(coalitionTag => host.tags[coalitionTag] > 0)),
      [(host: TaggedHost) => taggedVmCountPerHost[host.id], (host: TaggedHost) => -hostsAverages[host.id].memoryFree]
    )

    let destinationHost = sortedHosts.pop()
    if (!destinationHost) return promises

    for (const sourceHost of sortedHosts) {
      debugAffinity(
        `Host candidate: ${sourceHost.id}(${idToHost[sourceHost.id].name_label}) -> ${destinationHost.id}(${idToHost[destinationHost.id].name_label}).`
      )
      const sourceVms = filter(
        sourceHost.vms,
        vm => vm.xenTools && !this._isVmInCooldown(vm) && intersection(vm.tags, coalition).length > 0
      )

      debugAffinity(`VMs to migrate: ${sourceVms.map(vm => vm.name_label)}`)

      for (const vm of sourceVms) {
        let loopCountdown = sortedHosts.length
        while (
          hostsAverages[destinationHost!.id].memoryFree - vmsAverages[vm.id].memory <
          this._thresholds.memoryFree.critical
        ) {
          loopCountdown--
          debugAffinity(`Host ${sourceHost.id} is overcrowded`)
          const { promises: otherMigrationPromises, success } = await this._migrateOtherVms({
            crowdedHost: destinationHost!,
            hostsAverages,
            vmsAverages,
            idToHost,
            taggedHosts,
            memoryNeeded: vmsAverages[vm.id].memory,
          })
          promises.push(...otherMigrationPromises)

          if (!success) {
            debugAffinity(
              `Host ${sourceHost.id} does not have enough memory to get all "${tag}" tagged VMs (or its coalition)`
            )
            if (sourceHost === sortedHosts[sortedHosts.length - 1]) {
              warn(`affinity: Can't satisfy ${tag} affinity constraints (or its coalition)`)
              return promises
            }
            destinationHost = sortedHosts.pop()
          }
          if (loopCountdown < 0) {
            warn(`affinity: Broke out of potential infinite loop. This should not have happened.`)
            break
          }
        }

        promises.push(
          this._migrateVmAndUpdateInfos({
            destination: idToHost[destinationHost!.id],
            source: idToHost[sourceHost.id],
            sourceHost,
            destinationHost: destinationHost!,
            vm,
            hostsAverages,
            vmAverages: vmsAverages[vm.id],
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
    hostsAverages: Record<string, ResourceAverages>
    vmsAverages: Record<string, ResourceAverages>
    idToHost: Record<string, Host>
    taggedHosts: TaggedHosts
    memoryNeeded: number
  }): Promise<{ promises: Promise<boolean>[]; success: boolean }> {
    const promises: Promise<boolean>[] = []

    const candidateVms = sortBy(
      filter(
        Object.values(crowdedHost.vms),
        vm =>
          vm.xenTools &&
          !this._isVmInCooldown(vm) &&
          intersection(vm.tags, this._affinityTags).length === 0 &&
          intersection(vm.tags, this._antiAffinityTags).length === 0
      ),
      [(vm: Vm) => -vmsAverages[vm.id].memory]
    )
    debugAffinity(`Candidate VMs to be moved away: ${candidateVms.map(vm => vm.name_label)}`)

    for (const vm of candidateVms) {
      const vmAverages = vmsAverages[vm.id]

      const destinationHost = sortBy(taggedHosts.hosts, [
        (host: TaggedHost) => -hostsAverages[host.id].memoryFree,
        (host: TaggedHost) => hostsAverages[host.id].cpu,
      ]).find(host => {
        if (host.id === crowdedHost.id) {
          return false
        }
        const destinationAverages = hostsAverages[host.id]
        return (
          destinationAverages.cpu + vmAverages.cpu <= this._thresholds.cpu.critical &&
          destinationAverages.memoryFree - vmAverages.memory >= this._thresholds.memoryFree.critical
        )
      })

      if (destinationHost === undefined) {
        debug(`Cannot migrate VM (${vm.id}) to any host. VM requires ${vmAverages.memory}MB, CPU: ${vmAverages.cpu}%`)
        continue
      }

      promises.push(
        this._migrateVmAndUpdateInfos({
          destination: idToHost[destinationHost.id],
          source: idToHost[crowdedHost.id],
          sourceHost: crowdedHost,
          destinationHost,
          vm,
          hostsAverages,
          vmAverages,
        })
      )

      if (hostsAverages[crowdedHost.id].memoryFree - memoryNeeded > this._thresholds.memoryFree.critical) {
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
    destination: Host
    source: Host
    sourceHost: TaggedHost
    destinationHost: TaggedHost
    vm: Vm
    hostsAverages: Record<string, ResourceAverages>
    vmAverages: ResourceAverages
  }): Promise<boolean> {

    debugAffinity(
      `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destination.id} "${destination.name_label}") from Host (${source.id} "${source.name_label}").`
    )

    for (const tag of vm.tags) {
      if (this._affinityTags.includes(tag)) {
        sourceHost.tags[tag]--
        destinationHost.tags[tag]++
      }
    }

    const sourceAverages = hostsAverages[source.id]
    const destinationAverages = hostsAverages[destination.id]

    sourceAverages.cpu -= vmAverages.cpu
    destinationAverages.cpu += vmAverages.cpu

    sourceAverages.memoryFree += vmAverages.memory
    destinationAverages.memoryFree -= vmAverages.memory

    delete sourceHost.vms[vm.id]

    return this._migrateVm(vm, this.xo!.getXapi(source), this.xo!.getXapi(destination), destination._xapiId)
  }

  _isVmInCooldown(vm: Vm): boolean {
    const { migrationCooldown, migrationHistory } = this._globalOptions
    if (migrationCooldown > 0) {
      const lastMigration = migrationHistory.get(vm.id)
      if (lastMigration !== undefined && Date.now() - lastMigration < migrationCooldown) {
        return true
      }
    }
    return false
  }

  async _migrateVm(vm: Vm, xapiSrc: Xapi, xapiDest: Xapi, destHostId: string): Promise<boolean> {
    const { migrationHistory } = this._globalOptions
    try {
      await xapiSrc.assertCanMigrateVm(vm._xapiId, destHostId)
      await this._concurrentMigrationLimiter.call(xapiSrc, 'migrateVm', vm._xapiId, xapiDest, destHostId)
      migrationHistory.set(vm.id, Date.now())
      return true
    } catch (error) {
      warn(`Migration of VM ${vm.id} failed: ${error}`)
      return false
    }
  }

  _computeCoalitions(vms: Array<{ tags: string[] }>, affinityTags: string[]): Record<string, string[]> {
    const coalitions: Record<string, Set<string>> = {}
    for (const tag of affinityTags) {
      coalitions[tag] = new Set([tag])
    }
    for (const vm of vms) {
      const vmAffinityTags = intersection(vm.tags, affinityTags)
      if (vmAffinityTags.length > 1) {
        for (const tag1 of vmAffinityTags) {
          for (const tag2 of vmAffinityTags) {
            coalitions[tag1].add(tag2)
          }
        }
      }
    }

    for (const coalitionSet of Object.values(coalitions)) {
      coalitionSet.forEach(coalitionTag => {
        coalitions[coalitionTag].forEach(neighbourTag => {
          coalitionSet.add(neighbourTag)
        })
      })
    }

    const result: Record<string, string[]> = {}
    Object.keys(coalitions).forEach(tag => {
      result[tag] = Array.from(coalitions[tag])
    })

    return result
  }
}

// ===================================================================
// Internal helper types
// ===================================================================

interface VcpuHost {
  id: string
  poolId: string
  cpuCount: number
  vcpuCount: number
  vms: Record<string, Vm>
}

interface TaggedHost {
  id: string
  poolId: string
  tags: Record<string, number>
  vms: Record<string, Vm>
}

interface TaggedHosts {
  tagCount: Record<string, number>
  hosts: TaggedHost[]
}

function vcpuPerCpuRatio(host: VcpuHost): number {
  return host.vcpuCount / host.cpuCount
}
