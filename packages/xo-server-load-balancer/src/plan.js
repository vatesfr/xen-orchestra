import { filter, groupBy, includes, isEmpty, keyBy, map as mapToArray, maxBy, minBy, size, sortBy } from 'lodash'
import { inspect } from 'util'

import { EXECUTION_DELAY, debug } from './utils'

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

const numberOrDefault = (value, def) => (value >= 0 ? value : def)

export const debugAffinity = str => debug(`anti-affinity: ${str}`)
export const debugVcpuBalancing = str => debug(`vCPU balancing: ${str}`)

// ===================================================================
// Averages.
// ===================================================================

function computeAverage(values, nPoints) {
  if (values === undefined) {
    return
  }

  let sum = 0
  let tot = 0

  const { length } = values
  const start = nPoints !== undefined ? length - nPoints : 0

  for (let i = start; i < length; i++) {
    const value = values[i]

    sum += value || 0

    if (value) {
      tot += 1
    }
  }

  return sum / tot
}

function computeResourcesAverage(objects, objectsStats, nPoints) {
  const averages = {}

  for (const object of objects) {
    const { id } = object
    const { stats } = objectsStats[id]

    averages[id] = {
      cpu: computeAverage(mapToArray(stats.cpus, cpu => computeAverage(cpu, nPoints))),
      nCpus: size(stats.cpus),
      memoryFree: computeAverage(stats.memoryFree, nPoints),
      memory: computeAverage(stats.memory, nPoints),
    }
  }

  return averages
}

function computeResourcesAverageWithWeight(averages1, averages2, ratio) {
  const averages = {}

  for (const id in averages1) {
    const objectAverages = (averages[id] = {})

    for (const averageName in averages1[id]) {
      const average1 = averages1[id][averageName]
      if (average1 === undefined) {
        continue
      }

      objectAverages[averageName] = average1 * ratio + averages2[id][averageName] * (1 - ratio)
    }
  }

  return averages
}

function computeAverageCpu(hostsStats) {
  const hostsStatsArray = Object.values(hostsStats)
  const totalNbCpus = hostsStatsArray.reduce((sum, host) => sum + host.nCpus, 0)
  const weightedSum = hostsStatsArray.reduce((sum, host) => sum + host.cpu * host.nCpus, 0)
  return weightedSum / totalNbCpus
}

function setRealCpuAverageOfVms(vms, vmsAverages, nCpus) {
  for (const vm of vms) {
    const averages = vmsAverages[vm.id]
    averages.cpu *= averages.nCpus / nCpus
  }
}

// ===================================================================

function vcpuPerCpuRatio(host) {
  return host.vcpuCount / host.cpuCount
}

// ===================================================================

export default class Plan {
  constructor(
    xo,
    name,
    poolIds,
    { excludedHosts, thresholds, balanceVcpus, antiAffinityTags = [] },
    globalOptions,
    concurrentMigrationLimiter
  ) {
    this.xo = xo
    this._name = name
    this._poolIds = poolIds
    this._excludedHosts = excludedHosts
    this._thresholds = {
      cpu: {
        critical: numberOrDefault(thresholds && thresholds.cpu, DEFAULT_CRITICAL_THRESHOLD_CPU),
      },
      memoryFree: {
        critical:
          numberOrDefault(thresholds && thresholds.memoryFree, DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE) * 1024 * 1024,
      },
    }
    this._antiAffinityTags = antiAffinityTags
    // balanceVcpus variable name was kept for compatibility with past configuration schema
    this._performanceSubmode =
      balanceVcpus === false ? 'conservative' : balanceVcpus === true ? 'vCpuPrepositioning' : balanceVcpus
    this._globalOptions = globalOptions
    this._concurrentMigrationLimiter = concurrentMigrationLimiter

    for (const key in this._thresholds) {
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

  execute() {
    throw new Error('Not implemented')
  }

  // ===================================================================
  // Get hosts to optimize.
  // ===================================================================

  async _getHostStatsAverages({ hosts, toOptimizeOnly = false, checkAverages = false }) {
    const hostsStats = await this._getHostsStats(hosts, 'minutes')

    const avgNow = computeResourcesAverage(hosts, hostsStats, EXECUTION_DELAY)
    let toOptimize
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

    if (toOptimizeOnly) {
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

  _checkResourcesThresholds() {
    throw new Error('Not implemented')
  }

  // ===================================================================
  // Get objects.
  // ===================================================================

  _getPlanPools() {
    const pools = {}

    try {
      for (const poolId of this._poolIds) {
        pools[poolId] = this.xo.getObject(poolId)
      }
    } catch (_) {
      return {}
    }

    return pools
  }

  // Compute hosts for each pool. They can change over time.
  _getHosts({ powerState = 'Running' } = {}) {
    return filter(
      this.xo.getObjects(),
      object =>
        object.type === 'host' &&
        includes(this._poolIds, object.$poolId) &&
        object.power_state === powerState &&
        !includes(this._excludedHosts, object.id)
    )
  }

  _getAllRunningVms() {
    return filter(
      this.xo.getObjects(),
      object =>
        object.type === 'VM' &&
        object.power_state === 'Running' &&
        !object.tags.some(tag => this._globalOptions.ignoredVmTags.has(tag))
    )
  }

  // ===================================================================
  // Get stats.
  // ===================================================================

  async _getHostsStats(hosts, granularity) {
    const hostsStats = {}

    await Promise.all(
      hosts.map(host =>
        this.xo.getXapiHostStats(host, granularity).then(hostStats => {
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

  async _getVmsStats(vms, granularity) {
    const vmsStats = {}

    await Promise.all(
      vms.map(vm =>
        this.xo.getXapiVmStats(vm, granularity).then(vmStats => {
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

  async _getVmsAverages(vms, hosts) {
    const vmsStats = await this._getVmsStats(vms, 'minutes')
    const vmsAverages = computeResourcesAverageWithWeight(
      computeResourcesAverage(vms, vmsStats, EXECUTION_DELAY),
      computeResourcesAverage(vms, vmsStats, MINUTES_OF_HISTORICAL_DATA),
      0.75
    )

    // Compute real CPU usage. Virtuals cpus to reals cpus.
    for (const [hostId, hostVms] of Object.entries(groupBy(vms, '$container'))) {
      setRealCpuAverageOfVms(hostVms, vmsAverages, hosts[hostId].CPUs.cpu_count)
    }

    return vmsAverages
  }

  // ===================================================================
  // vCPU pre-positioning helpers
  // ===================================================================

  async _processVcpuPrepositioning(hosts) {
    const promises = []

    const idToHost = keyBy(hosts, 'id')
    const allVms = filter(this._getAllRunningVms(), vm => vm.$container in idToHost)
    const hostList = this._getVCPUHosts(hosts, allVms)
    const idealVcpuPerCpuRatio =
      hostList.reduce((sum, host) => sum + host.vcpuCount, 0) / hostList.reduce((sum, host) => sum + host.cpuCount, 0)

    debugVcpuBalancing('Trying to apply vCPU prepositioning.')
    debugVcpuBalancing(`vCPU count per host: ${inspect(hostList, { depth: null })}`)
    debugVcpuBalancing(`Average vCPUs per CPU: ${idealVcpuPerCpuRatio}`)

    // execute prepositioning only if vCPU/CPU ratios are different enough, to prevent executing too often
    // TODO: maybe we should apply a more complex function than just a ratio, to have more coherent values on both small and big architectures
    const ratio = vcpuPerCpuRatio(minBy(hostList, vcpuPerCpuRatio)) / vcpuPerCpuRatio(maxBy(hostList, vcpuPerCpuRatio))
    if (ratio > THRESHOLD_VCPU_RATIO) {
      debugVcpuBalancing(`vCPU ratios not different enough: ${ratio}`)
      return
    }

    // execute prepositioning only if the pool is not loaded too much
    const { averages: hostsAverages } = await this._getHostStatsAverages({ hosts })
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
        host => -vcpuPerCpuRatio(host),
        // Find hosts with the most memory used
        // TODO: if memory is nearly the same between two hosts, ignore this criteria and decide based on CPU usage (do the same in other sortBy, see epsiEqual)
        host => hostsAverages[host.id].memoryFree,
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
          host => host.poolId === sourceHost.poolId,
          vcpuPerCpuRatio,
          host => -hostsAverages[host.id].memoryFree,
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

        // calculating how many vCPUs destination should accept
        let deltaDestination = destinationHost.vcpuCount - destinationHost.cpuCount * idealVcpuPerCpuRatio

        if (
          deltaDestination >= 0 ||
          hostsAverages[destinationHost.id].cpu > this._thresholds.cpu.low ||
          hostsAverages[destinationHost.id].memoryFree < this._thresholds.memoryFree.low
        ) {
          continue
        }

        // deltaSource = max amount of vCPUs source should give, deltaDestination = max amount of vCPUs destination should accept, delta = max amount of vCPUs to migrate to satisfy both
        // avoiding to migrate too much vCPUs for source or destination: deltaSource is positive, deltaDestination is negative, we check which one has greater absolute value
        // using ceil instead of floor prevents edge cases where a host would become a bit overloaded, but can lead to some host being a bit underloaded
        // ex: if we have a host with 19 vCPU and 9 host with 10 vCPU, each with the same number of CPU, then ideal vCPU per host is 10.9, rounding to 10 would make host with 19 vCPU have no destination to send VMs to
        // reversely, we could have a host with 5 vCPU and 9 host with 10 vCPU, and then the 5 vCPU host would have no source to receive VMs from
        let delta = Math.ceil(Math.min(deltaSource, -deltaDestination))
        const vms = sortBy(
          filter(
            sourceVms,
            vm => hostsAverages[destinationHost.id].memoryFree >= vmsAverages[vm.id].memory && vm.CPUs.number <= delta
          ),
          [vm => -vm.CPUs.number]
        )

        for (const vm of vms) {
          // migrate only if destination is vCPU-underloaded and if this does not cause performance issues
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
            // 3. Update tags and averages.
            // This update can change the source host for the next migration.
            sourceHost.vcpuCount -= vm.CPUs.number
            destinationHost.vcpuCount += vm.CPUs.number

            const destinationAverages = hostsAverages[destinationHost.id]
            const vmAverages = vmsAverages[vm.id]

            destinationAverages.cpu += vmAverages.cpu
            destinationAverages.memoryFree -= vmAverages.memory

            // Updating VM array to avoiding migrating the same VM twice
            delete sourceHost.vms[vm.id]
            sourceVms = Object.values(sourceHost.vms)

            // 4. Migrate.
            const sourceXapi = this.xo.getXapi(source)
            promises.push(
              this._concurrentMigrationLimiter.call(
                sourceXapi,
                'migrateVm',
                vm._xapiId,
                this.xo.getXapi(destination),
                destination._xapiId
              )
            )
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

  _getVCPUHosts(hosts, vms) {
    const idToHost = {}
    for (const host of hosts) {
      const taggedHost = (idToHost[host.id] = {
        id: host.id,
        poolId: host.$poolId,
        cpuCount: parseInt(host.CPUs.cpu_count),
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
      const hostId = vm.$container
      if (!(hostId in idToHost)) {
        continue
      }

      const host = idToHost[hostId]
      host.vcpuCount += vm.CPUs.number

      if (vm.xenTools && vm.tags.every(tag => !this._antiAffinityTags.includes(tag))) {
        host.vms[vm.id] = vm
      }
    }

    return Object.values(idToHost)
  }

  // ===================================================================
  // Anti-affinity helpers
  // ===================================================================

  async _processAntiAffinity() {
    if (!this._antiAffinityTags.length) {
      return
    }

    const allHosts = await this._getHosts()
    if (allHosts.length <= 1) {
      return
    }
    const idToHost = keyBy(allHosts, 'id')

    const allVms = filter(this._getAllRunningVms(), vm => vm.$container in idToHost)
    const taggedHosts = this._getAntiAffinityTaggedHosts(allHosts, allVms)

    // 1. Check if we must migrate VMs...
    const tagsDiff = {}
    for (const watchedTag of this._antiAffinityTags) {
      const getCount = fn => fn(taggedHosts.hosts, host => host.tags[watchedTag]).tags[watchedTag]
      const diff = getCount(maxBy) - getCount(minBy)
      if (diff > 1) {
        tagsDiff[watchedTag] = diff - 1
      }
    }
    if (isEmpty(tagsDiff)) {
      return
    }

    // 2. Migrate!
    debugAffinity('Try to apply anti-affinity policy.')
    debugAffinity(`VM tag count per host: ${inspect(taggedHosts, { depth: null })}.`)
    debugAffinity(`Tags diff: ${inspect(tagsDiff, { depth: null })}.`)

    const vmsAverages = await this._getVmsAverages(allVms, idToHost)
    const { averages: hostsAverages } = await this._getHostStatsAverages({ hosts: allHosts })

    debugAffinity(`Hosts averages: ${inspect(hostsAverages, { depth: null })}.`)

    const promises = []
    for (const tag in tagsDiff) {
      promises.push(...this._processAntiAffinityTag({ tag, vmsAverages, hostsAverages, taggedHosts, idToHost }))
    }

    // 3. Done!
    debugAffinity(`VM tag count per host after migration: ${inspect(taggedHosts, { depth: null })}.`)
    return Promise.all(promises)
  }

  _processAntiAffinityTag({ tag, vmsAverages, hostsAverages, taggedHosts, idToHost }) {
    const promises = []

    while (true) {
      // 1. Find source host from which to migrate.
      const sources = sortBy(
        filter(taggedHosts.hosts, host => host.tags[tag] > 1),
        [
          host => host.tags[tag],
          // Find host with the most memory used. Don't forget the "-". ;)
          host => -hostsAverages[host.id].memoryFree,
        ]
      )

      for (let sourceIndex = sources.length; sourceIndex >= 0; --sourceIndex) {
        if (sourceIndex === 0) {
          return promises // Nothing to migrate or we can't.
        }

        const sourceHost = sources[sourceIndex - 1]

        // 2. Find destination host.
        const destinations = sortBy(
          filter(taggedHosts.hosts, host => host.id !== sourceHost.id && host.tags[tag] + 1 < sourceHost.tags[tag]),
          [
            host => host.tags[tag],
            // Ideally it would be interesting to migrate in the same pool.
            host => host.poolId !== sourceHost.poolId,
            // Find host with the least memory used. Don't forget the "-". ;)
            host => -hostsAverages[host.id].memoryFree,
          ]
        )
        if (!destinations.length) {
          return promises // Cannot find a valid destination.
        }

        // Build VM list to migrate.
        // We try to migrate VMs with the targeted tag.
        const sourceVms = filter(sourceHost.vms, vm => vm.tags.includes(tag))

        let destinationHost
        let vm
        for (const destination of destinations) {
          destinationHost = destination
          debugAffinity(`Host candidate: ${sourceHost.id} -> ${destinationHost.id}.`)

          const vms = filter(sourceVms, vm => hostsAverages[destinationHost.id].memoryFree >= vmsAverages[vm.id].memory)

          debugAffinity(
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
          continue // If we can't find a VM to migrate, we must try with another source!
        }

        const source = idToHost[sourceHost.id]
        const destination = idToHost[destinationHost.id]
        debugAffinity(
          `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destinationHost.id} "${destination.name_label}") from Host (${sourceHost.id} "${source.name_label}").`
        )

        // 3. Update tags and averages.
        // This update can change the source host for the next migration.
        for (const tag of vm.tags) {
          if (this._antiAffinityTags.includes(tag)) {
            sourceHost.tags[tag]--
            destinationHost.tags[tag]++
          }
        }

        const destinationAverages = hostsAverages[destinationHost.id]
        const vmAverages = vmsAverages[vm.id]

        destinationAverages.cpu += vmAverages.cpu
        destinationAverages.memoryFree -= vmAverages.memory

        delete sourceHost.vms[vm.id]

        // 4. Migrate.
        promises.push(
          this._concurrentMigrationLimiter.call(
            this.xo.getXapi(source),
            'migrateVm',
            vm._xapiId,
            this.xo.getXapi(destination),
            destination._xapiId
          )
        )

        break // Continue with the same tag, the source can be different.
      }
    }
  }

  _getAntiAffinityTaggedHosts(hosts, vms) {
    const tagCount = {}
    for (const tag of this._antiAffinityTags) {
      tagCount[tag] = 0
    }

    const taggedHosts = {}
    for (const host of hosts) {
      const tags = {}
      for (const tag of this._antiAffinityTags) {
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
      const hostId = vm.$container
      if (!(hostId in taggedHosts)) {
        continue
      }

      const taggedHost = taggedHosts[hostId]

      for (const tag of vm.tags) {
        if (this._antiAffinityTags.includes(tag)) {
          tagCount[tag]++
          taggedHost.tags[tag]++
          taggedHost.vms[vm.id] = vm
        }
      }
    }

    return { tagCount, hosts: Object.values(taggedHosts) }
  }

  _computeAntiAffinityVariance(taggedHosts) {
    // See: https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance
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

  _getAntiAffinityVmToMigrate({ vms, vmsAverages, hostsAverages, taggedHosts, sourceHost, destinationHost }) {
    let bestVariance = this._computeAntiAffinityVariance(taggedHosts)
    let bestVm

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
          debugAffinity(`VM (${vm.id}) of Host (${sourceHost.id}) does not support pool migration.`)
        }
      }
    }

    return bestVm
  }
}
