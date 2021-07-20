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

const numberOrDefault = (value, def) => (value >= 0 ? value : def)

export const debugAffinity = str => debug(`anti-affinity: ${str}`)

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

function setRealCpuAverageOfVms(vms, vmsAverages, nCpus) {
  for (const vm of vms) {
    const averages = vmsAverages[vm.id]
    averages.cpu *= averages.nCpus / nCpus
  }
}

// ===================================================================

export default class Plan {
  constructor(xo, name, poolIds, { excludedHosts, thresholds, antiAffinityTags = [] }, globalOptions) {
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
    this._globalOptions = globalOptions

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

  async _getHostStatsAverages({ hosts, toOptimizeOnly = false }) {
    const hostsStats = await this._getHostsStats(hosts, 'minutes')

    const avgNow = computeResourcesAverage(hosts, hostsStats, EXECUTION_DELAY)
    let toOptimize
    if (toOptimizeOnly) {
      // Check if a resource utilization exceeds threshold.
      toOptimize = this._checkResourcesThresholds(hosts, avgNow)
      if (toOptimize.length === 0) {
        debug('No hosts to optimize.')
        return
      }
    }

    const avgBefore = computeResourcesAverage(hosts, hostsStats, MINUTES_OF_HISTORICAL_DATA)
    const avgWithRatio = computeResourcesAverageWithWeight(avgNow, avgBefore, 0.75)

    if (toOptimizeOnly) {
      // Check in the last 30 min interval with ratio.
      toOptimize = this._checkResourcesThresholds(toOptimize, avgWithRatio)
      if (toOptimize.length === 0) {
        debug('No hosts to optimize.')
        return
      }
    }

    return {
      toOptimize,
      averages: avgWithRatio,
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
        promises.push(this.xo.getXapi(source).migrateVm(vm._xapiId, this.xo.getXapi(destination), destination._xapiId))

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
