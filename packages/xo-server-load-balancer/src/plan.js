import { limitConcurrency } from 'limit-concurrency-decorator'
import {
  filter,
  groupBy,
  includes,
  intersection,
  isEmpty,
  keyBy,
  map as mapToArray,
  maxBy,
  minBy,
  size,
  sortBy,
} from 'lodash'
import { inspect } from 'util'

import { EXECUTION_DELAY, debug, warn } from './utils'

// caps how many `set_affinity` XAPI calls _processVmToHostAffinity fires at once; independent from
// _concurrentMigrationLimiter, which is dedicated to actual VM migrations
const MAX_CONCURRENT_AFFINITY_UPDATES = 5

// value is shared with DEFAULT_LOAD_BALANCER_RE_ENABLE_DELAY in packages/xo-server/src/xo-mixins/xen-servers.mjs
// and loadBalancerReEnableDelay in config.toml
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

export const debugAffinity = str => debug(`affinity: ${str}`)
export const debugAntiAffinity = str => debug(`anti-affinity: ${str}`)
export const debugVcpuBalancing = str => debug(`vCPU balancing: ${str}`)
export const debugVmToHostAffinity = str => debug(`vm-to-host affinity: ${str}`)

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
    { excludedHosts, thresholds, balanceVcpus, affinityTags = [], antiAffinityTags = [], vmToHostAffinityTags = [] },
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
    this._affinityTags = affinityTags
    this._antiAffinityTags = antiAffinityTags
    this._vmToHostAffinityTags = vmToHostAffinityTags
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
        !includes(this._excludedHosts, object.id) &&
        object.enabled === true
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
  // Migration helpers
  // ===================================================================

  // Check if VM was recently migrated and is in cooldown period
  _isVmInCooldown(vm) {
    const { migrationCooldown, migrationHistory } = this._globalOptions
    if (migrationCooldown > 0) {
      const lastMigration = migrationHistory.get(vm.id)
      if (lastMigration !== undefined && Date.now() - lastMigration < migrationCooldown) {
        return true
      }
    }
    return false
  }

  _migrateVm({ vm, xapiSrc, xapiDest, srcHostId, destHostId, reason }) {
    const { migrationHistory } = this._globalOptions
    return this._concurrentMigrationLimiter(() => {
      const task = this.xo.tasks.create({
        name: `Load balancer migrates VM ${vm.name_label} (${vm.id})`,
        description: `Migrating VM ${vm.name_label} (${vm.id}) from host ${srcHostId} to host ${destHostId} ${reason}`,
        objectId: vm.id,
        type: 'xo:load-balancer:migration',
      })
      return task.run(async () =>
        xapiSrc.migrateVm(vm._xapiId, xapiDest, destHostId).then(() => {
          migrationHistory.set(vm.id, Date.now())
        })
      )
    })
  }

  // More co-located same-tag VMs is better: compares against the VM's current host instead of
  // requiring an absolute count, so a VM with no current affinity-mates is never stuck.
  _wouldDeteriorateAffinity({ vm, countsByHostId, sourceHostId, destinationHostId }) {
    const tags = intersection(vm.tags, this._affinityTags)
    if (tags.length === 0) {
      return false
    }
    return tags.some(tag => {
      const sourceOtherCount = countsByHostId[sourceHostId].tagCounts[tag] - 1
      const destinationCount = countsByHostId[destinationHostId].tagCounts[tag]
      return destinationCount < sourceOtherCount
    })
  }

  // Fewer co-located same-tag VMs is better: compares against the VM's current host so that, when
  // there are more anti-affinity-tagged VMs than hosts, spreading them as evenly as possible stays
  // allowed instead of requiring a conflict-free destination that may not exist.
  _wouldDeteriorateAntiAffinity({ vm, countsByHostId, sourceHostId, destinationHostId }) {
    const tags = intersection(vm.tags, this._antiAffinityTags)
    return tags.some(tag => {
      const sourceOtherCount = countsByHostId[sourceHostId].tagCounts[tag] - 1
      const destinationCount = countsByHostId[destinationHostId].tagCounts[tag]
      return destinationCount > sourceOtherCount
    })
  }

  // Matching more of the VM's vm-to-host affinity tags is better: compares against the VM's current
  // host so an already-misplaced VM (or a tag matching no host) never gets stuck.
  _wouldDeteriorateVmToHostAffinity({ vm, idToHost, sourceHostId, destinationHostId }) {
    const tags = intersection(vm.tags, this._vmToHostAffinityTags)
    if (tags.length === 0) {
      return false
    }
    const sourceMatches = intersection(tags, idToHost[sourceHostId].tags).length
    const destinationMatches = intersection(tags, idToHost[destinationHostId].tags).length
    return sourceMatches > destinationMatches
  }

  // ===================================================================
  // vCPU pre-positioning helpers
  // ===================================================================

  async _processVcpuPrepositioning(hosts) {
    const promises = []

    // removing hosts which have incorrect cpu count value to avoid mass migration on rrd malfunction
    const sanitizedHostList = hosts.filter(host => host.cpus.cores > 0)
    if (sanitizedHostList.length < hosts.length) {
      const unhealthyHosts = hosts.filter(host => host.cpus.cores === undefined || host.cpus.cores === 0)
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

    // per-host counts of affinity/anti-affinity tagged VMs, to check whether a candidate destination
    // would deteriorate a VM's constraints, instead of excluding it from vCPU prepositioning entirely
    const affinityCountsByHostId = this._affinityTags.length
      ? keyBy(this._getTaggedHosts({ hosts: sanitizedHostList, tagList: this._affinityTags, vms: allVms }).hosts, 'id')
      : undefined
    const antiAffinityCountsByHostId = this._antiAffinityTags.length
      ? keyBy(
          this._getTaggedHosts({ hosts: sanitizedHostList, tagList: this._antiAffinityTags, vms: allVms }).hosts,
          'id'
        )
      : undefined

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
        // don't exclude VMs with meaningful tags entirely: only avoid a destination that would
        // deteriorate the VM's affinity / anti-affinity / vm-to-host affinity constraints
        const vms = sortBy(
          filter(sourceVms, vm => {
            if (
              this._isVmInCooldown(vm) ||
              hostsAverages[destinationHost.id].memoryFree < vmsAverages[vm.id].memory ||
              vm.CPUs.number > delta
            ) {
              return false
            }

            const params = { vm, sourceHostId: sourceHost.id, destinationHostId: destinationHost.id }
            return (
              !this._wouldDeteriorateAffinity({ ...params, countsByHostId: affinityCountsByHostId }) &&
              !this._wouldDeteriorateAntiAffinity({ ...params, countsByHostId: antiAffinityCountsByHostId }) &&
              !this._wouldDeteriorateVmToHostAffinity({ ...params, idToHost })
            )
          }),
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
            promises.push(
              this._migrateVm({
                vm,
                xapiSrc: this.xo.getXapi(source),
                xapiDest: this.xo.getXapi(destination),
                srcHostId: source.id,
                destHostId: destination._xapiId,
                reason: 'to balance vCPUs over CPUs',
              })
            )
            // keep our local counts in sync so later VMs in this loop aren't checked against stale data
            this._adjustTagCounts(
              affinityCountsByHostId,
              intersection(vm.tags, this._affinityTags),
              sourceHost.id,
              destinationHost.id
            )
            this._adjustTagCounts(
              antiAffinityCountsByHostId,
              intersection(vm.tags, this._antiAffinityTags),
              sourceHost.id,
              destinationHost.id
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

      // don't exclude VMs with meaningful tags entirely: _processVcpuPrepositioning avoids
      // destinations that would deteriorate their affinity / anti-affinity / vm-to-host affinity
      // constraints instead
      if (vm.xenTools) {
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

    // process each pool independently: spreading anti-affinity-tagged VMs must never cross pool
    // boundaries, since that would force a heavy storage-motion migration.
    // No pool parallelization because we're limited by the concurrent migration limiter.
    const allHosts = this._getHosts()
    const promises = []
    for (const poolId of this._poolIds) {
      const poolHosts = filter(allHosts, host => host.$poolId === poolId)
      if (poolHosts.length <= 1) {
        continue
      }
      try {
        promises.push(...(await this._processAntiAffinityForHosts(poolHosts)))
      } catch (error) {
        warn(`anti-affinity: failed to process pool ${poolId}`, { poolId, error })
      }
    }
    return Promise.all(promises)
  }

  async _processAntiAffinityForHosts(allHosts) {
    const idToHost = keyBy(allHosts, 'id')

    const allVms = filter(this._getAllRunningVms(), vm => vm.$container in idToHost)
    const taggedHosts = this._getTaggedHosts({ hosts: allHosts, tagList: this._antiAffinityTags, vms: allVms })

    // 1. Check if we must migrate VMs...
    const tagsDiff = {}
    for (const watchedTag of this._antiAffinityTags) {
      const getCount = fn => fn(taggedHosts.hosts, host => host.tagCounts[watchedTag]).tagCounts[watchedTag]
      const diff = getCount(maxBy) - getCount(minBy)
      if (diff > 1) {
        tagsDiff[watchedTag] = diff - 1
      }
    }
    if (isEmpty(tagsDiff)) {
      return []
    }

    // 2. Migrate!
    debugAntiAffinity('Try to apply anti-affinity policy.')
    debugAntiAffinity(`VM tag count per host: ${inspect(taggedHosts, { depth: null })}.`)
    debugAntiAffinity(`Tags diff: ${inspect(tagsDiff, { depth: null })}.`)

    const vmsAverages = await this._getVmsAverages(allVms, idToHost)
    const { averages: hostsAverages } = await this._getHostStatsAverages({ hosts: allHosts })

    debugAntiAffinity(`Hosts averages: ${inspect(hostsAverages, { depth: null })}.`)

    const promises = []
    for (const tag in tagsDiff) {
      promises.push(...this._processAntiAffinityTag({ tag, vmsAverages, hostsAverages, taggedHosts, idToHost }))
    }

    // 3. Done!
    debugAntiAffinity(`VM tag count per host after migration: ${inspect(taggedHosts, { depth: null })}.`)
    return promises
  }

  _processAntiAffinityTag({ tag, vmsAverages, hostsAverages, taggedHosts, idToHost }) {
    const promises = []

    // per-host counts of affinity tagged VMs, to check whether a candidate destination would
    // deteriorate a VM's affinity constraint, instead of blocking its migration entirely
    const affinityCountsByHostId = this._affinityTags.length
      ? keyBy(
          this._getTaggedHosts({
            hosts: Object.values(idToHost),
            tagList: this._affinityTags,
            vms: this._getAllRunningVms(),
          }).hosts,
          'id'
        )
      : undefined

    while (true) {
      // safety to prevent infinite loop if destination has no VM able to migrate
      let emptyLoop = true
      // 1. Find source host from which to migrate.
      const sources = sortBy(
        filter(taggedHosts.hosts, host => host.tagCounts[tag] > 1),
        [
          host => host.tagCounts[tag],
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
          filter(
            taggedHosts.hosts,
            host => host.id !== sourceHost.id && host.tagCounts[tag] + 1 < sourceHost.tagCounts[tag]
          ),
          [
            host => host.tagCounts[tag],
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
          debugAntiAffinity(`Host candidate: ${sourceHost.id} -> ${destinationHost.id}.`)

          // don't exclude VMs with meaningful tags entirely: only avoid a destination that would
          // deteriorate the VM's affinity / vm-to-host affinity constraints
          const vms = filter(sourceVms, vm => {
            if (this._isVmInCooldown(vm) || hostsAverages[destinationHost.id].memoryFree < vmsAverages[vm.id].memory) {
              return false
            }

            return (
              !this._wouldDeteriorateAffinity({
                vm,
                countsByHostId: affinityCountsByHostId,
                sourceHostId: sourceHost.id,
                destinationHostId: destinationHost.id,
              }) &&
              !this._wouldDeteriorateVmToHostAffinity({
                vm,
                idToHost,
                sourceHostId: sourceHost.id,
                destinationHostId: destinationHost.id,
              })
            )
          })

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
          continue // If we can't find a VM to migrate, we must try with another source!
        }

        const source = idToHost[sourceHost.id]
        const destination = idToHost[destinationHost.id]

        // 3. Update tags and averages, and migrate.
        // This update can change the source host for the next migration.
        promises.push(
          this._migrateVmAndUpdateInfos({
            destination,
            source,
            sourceHost,
            destinationHost,
            vm,
            hostsAverages,
            vmAverages: vmsAverages[vm.id],
            reason: `to satisfy anti-affinity of tag ${tag}`,
          })
        )
        // keep our local affinity counts in sync so later migrations in this loop aren't checked
        // against stale data
        this._adjustTagCounts(
          affinityCountsByHostId,
          intersection(vm.tags, this._affinityTags),
          sourceHost.id,
          destinationHost.id
        )
        emptyLoop = false

        break // Continue with the same tag, the source can be different.
      }

      if (emptyLoop) {
        break
      }
    }
  }

  // Keep a per-host tag-count map (as returned by `_getTaggedHosts`) in sync with a migration decided
  // within the same loop that computed it, so later iterations don't check against stale counts.
  _adjustTagCounts(countsByHostId, tags, sourceHostId, destinationHostId) {
    if (countsByHostId === undefined) {
      return
    }
    for (const tag of tags) {
      countsByHostId[sourceHostId].tagCounts[tag]--
      countsByHostId[destinationHostId].tagCounts[tag]++
    }
  }

  _getTaggedHosts({ hosts, tagList, vms, includeUntaggedVms = false }) {
    const tagCount = {}
    for (const tag of tagList) {
      tagCount[tag] = 0
    }

    const taggedHosts = {}
    for (const host of hosts) {
      const tagCounts = {}
      for (const tag of tagList) {
        tagCounts[tag] = 0
      }

      const taggedHost = (taggedHosts[host.id] = {
        id: host.id,
        poolId: host.$poolId,
        tagCounts,
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

      if (includeUntaggedVms) {
        taggedHost.vms[vm.id] = vm
      }
      for (const tag of vm.tags) {
        if (tagList.includes(tag)) {
          tagCount[tag]++
          taggedHost.tagCounts[tag]++
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
      const k = hosts[0].tagCounts[tag]

      let ex = 0
      let ex2 = 0

      for (const host of hosts) {
        const x = host.tagCounts[tag]
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
        sourceHost.tagCounts[tag]--
        destinationHost.tagCounts[tag]++
      }

      const variance = this._computeAntiAffinityVariance(taggedHosts)

      for (const tag of vmTags) {
        sourceHost.tagCounts[tag]++
        destinationHost.tagCounts[tag]--
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

  async _processAffinity() {
    if (!this._affinityTags.length) {
      return
    }

    // process each pool independently: consolidating affinity-tagged VMs onto a single host must never
    // cross pool boundaries, since that would force a heavy storage-motion migration.
    // No pool parallelization because we're limited by the concurrent migration limiter.
    const allHosts = this._getHosts()
    const promises = []
    for (const poolId of this._poolIds) {
      const poolHosts = filter(allHosts, host => host.$poolId === poolId)
      if (poolHosts.length <= 1) {
        continue
      }
      try {
        promises.push(...(await this._processAffinityForHosts(poolHosts)))
      } catch (error) {
        warn(`affinity: failed to process pool ${poolId}`, { poolId, error })
      }
    }
    return Promise.allSettled(promises)
  }

  async _processAffinityForHosts(allHosts) {
    const idToHost = keyBy(allHosts, 'id')

    const allVms = filter(this._getAllRunningVms(), vm => vm.$container in idToHost)
    const taggedHosts = this._getTaggedHosts({
      hosts: allHosts,
      tagList: this._affinityTags,
      vms: allVms,
      includeUntaggedVms: true,
    })

    // 1. Check if we must migrate VMs...
    const spreadTags = []
    for (const watchedTag of this._affinityTags) {
      const taggedHostCount = taggedHosts.hosts.reduce(
        (accumulator, host) => accumulator + (host.tagCounts[watchedTag] > 0),
        0
      )
      if (taggedHostCount > 1) {
        spreadTags.push(watchedTag)
      }
    }
    if (spreadTags.length === 0) {
      return []
    }

    // 2. Check for tag coalitions: when a VM has multiple affinity tags, these tags should be considered as the same tag
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
    const { averages: hostsAverages } = await this._getHostStatsAverages({ hosts: allHosts })

    debugAffinity(`Hosts averages: ${inspect(hostsAverages, { depth: null })}.`)

    const promises = []
    const alreadyProcessed = new Set() // processed with another tag of its coalition
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

    // 4. Done!
    debugAffinity(`VM tag count per host after migration: ${inspect(taggedHosts, { depth: null })}`)
    return promises
  }

  async _processAffinityTag({ tag, vmsAverages, hostsAverages, taggedHosts, idToHost, coalition }) {
    debugAffinity(`Processing tag ${tag} (coalition: ${coalition})`)
    const promises = []

    // Find destination host that will get all the tagged VMs

    // computing the sum of number of VMs per coalition to avoid doing it multiple times while sorting
    // in case of coalitions, the sum is incorrect as VMs are counted twice, but it gives an approximation without parsing all the VMs again
    const taggedVmCountPerHost = {}
    // number of coalition-tagged VMs on the host that also share a vm-to-host-affinity tag with their host:
    // such a VM likely can't be migrated away without deteriorating its vm-to-host affinity, so its host
    // should be preferred as the destination rather than as a source we could never actually migrate it from
    const pinnedVmCountPerHost = {}
    for (const host of taggedHosts.hosts) {
      taggedVmCountPerHost[host.id] = coalition.reduce((sum, coalitionTag) => sum + host.tagCounts[coalitionTag], 0)
      pinnedVmCountPerHost[host.id] = Object.values(host.vms).reduce(
        (sum, vm) =>
          sum +
          (intersection(vm.tags, coalition).length > 0 &&
          intersection(vm.tags, this._vmToHostAffinityTags, idToHost[host.id].tags).length > 0
            ? 1
            : 0),
        0
      )
    }

    const sortedHosts = sortBy(
      taggedHosts.hosts.filter(host => coalition.some(coalitionTag => host.tagCounts[coalitionTag] > 0)),
      [
        host => taggedVmCountPerHost[host.id],
        host => pinnedVmCountPerHost[host.id],
        host => -hostsAverages[host.id].memoryFree,
      ]
    )

    // hosts are sorted from having the least tagged VMs to the most, so we pick destinationHost from the end of the list
    let destinationHost = sortedHosts.pop()

    // Migrate tagged VMs from every other host
    for (const sourceHost of sortedHosts) {
      debugAffinity(
        `Host candidate: ${sourceHost.id}(${idToHost[sourceHost.id].name_label}) -> ${destinationHost.id}(${idToHost[destinationHost.id].name_label}).`
      )
      // Build VM list to migrate.
      // We try to migrate VMs with the targeted tag.
      const sourceVms = filter(
        sourceHost.vms,
        vm => vm.xenTools && !this._isVmInCooldown(vm) && intersection(vm.tags, coalition).length > 0
      )

      debugAffinity(`VMs to migrate: ${sourceVms.map(vm => vm.name_label)}`)

      for (const vm of sourceVms) {
        if (
          this._wouldDeteriorateVmToHostAffinity({
            vm,
            idToHost,
            sourceHostId: sourceHost.id,
            destinationHostId: destinationHost.id,
          })
        ) {
          debug(
            `affinity: VM (${vm.id} "${vm.name_label}") cannot be migrated to satisfy affinity tag ${tag}: would deteriorate its vm-to-host affinity.`
          )
          continue
        }

        // if host can't receive all tagged VMs
        let loopCountdown = sortedHosts.length // a theoretically unnecessary safety against infinite while
        while (
          hostsAverages[destinationHost.id].memoryFree - vmsAverages[vm.id].memory <
          this._thresholds.memoryFree.critical
        ) {
          loopCountdown--
          debugAffinity(`Host ${sourceHost.id} is overcrowded`)
          // A) migrate other VMs to try to free some memory on destination host
          const { promises: otherMigrationPromises, success } = await this._migrateOtherVms({
            crowdedHost: destinationHost,
            hostsAverages,
            vmsAverages,
            idToHost,
            taggedHosts,
            memoryNeeded: vmsAverages[vm.id].memory,
            reason: `to free up resources on host to later migrate affinity-tagged VMs to it (${tag})`,
          })
          promises.push(...otherMigrationPromises)

          // B) if we can't do A), change the destination to the next host to create another host with several VMs with that tag
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
            destination: idToHost[destinationHost.id],
            source: idToHost[sourceHost.id],
            sourceHost,
            destinationHost,
            vm,
            hostsAverages,
            vmAverages: vmsAverages[vm.id],
            reason: `to satisfy affinity of tag ${tag}`,
          })
        )
      }
    }
    return promises
  }

  async _migrateOtherVms({ crowdedHost, hostsAverages, vmsAverages, idToHost, taggedHosts, memoryNeeded, reason }) {
    const promises = []

    // per-host counts of affinity/anti-affinity tagged VMs, to check whether a candidate destination
    // would deteriorate a VM's constraints, instead of blocking its migration entirely
    const allHosts = Object.values(idToHost)
    const allRunningVms = this._getAllRunningVms()
    const affinityCountsByHostId = this._affinityTags.length
      ? keyBy(this._getTaggedHosts({ hosts: allHosts, tagList: this._affinityTags, vms: allRunningVms }).hosts, 'id')
      : undefined
    const antiAffinityCountsByHostId = this._antiAffinityTags.length
      ? keyBy(
          this._getTaggedHosts({ hosts: allHosts, tagList: this._antiAffinityTags, vms: allRunningVms }).hosts,
          'id'
        )
      : undefined

    const candidateVms = sortBy(
      filter(Object.values(crowdedHost.vms), vm => vm.xenTools && !this._isVmInCooldown(vm)),
      [vm => -vmsAverages[vm.id].memory] // try to migrate bigger VMs first to minimize the number of migrations
    )
    debugAffinity(`Candidate VMs to be moved away: ${candidateVms.map(vm => vm.name_label)}`)

    for (const vm of candidateVms) {
      // try to migrate vm

      const vmAverages = vmsAverages[vm.id]
      const affinityTags = intersection(vm.tags, this._affinityTags)
      const antiAffinityTags = intersection(vm.tags, this._antiAffinityTags)

      const destinationHost = sortBy(
        taggedHosts.hosts,
        [host => -hostsAverages[host.id].memoryFree, host => hostsAverages[host.id].cpu] // try to migrate to hosts with the most free space first
      ).find(host => {
        if (host.id === crowdedHost.id) {
          return false
        }
        const params = { vm, sourceHostId: crowdedHost.id, destinationHostId: host.id }
        if (
          this._wouldDeteriorateAffinity({ ...params, countsByHostId: affinityCountsByHostId }) ||
          this._wouldDeteriorateAntiAffinity({ ...params, countsByHostId: antiAffinityCountsByHostId }) ||
          this._wouldDeteriorateVmToHostAffinity({ ...params, idToHost })
        ) {
          return false
        }
        const destinationAverages = hostsAverages[host.id]
        return (
          destinationAverages.cpu + vmAverages.cpu <= this._thresholds.cpu.critical &&
          destinationAverages.memoryFree - vmAverages.memory >= this._thresholds.memoryFree.critical
        )
      })

      if (destinationHost === undefined) {
        // no host can accept this VM, let's try another one
        debug(`Cannot migrate VM (${vm.id}) to any host. VM requires ${vmAverages.memory}MB, CPU: ${vmAverages.cpu}%`)
        continue
      }

      // destination found, now migrate and update tags & averages
      promises.push(
        this._migrateVmAndUpdateInfos({
          destination: idToHost[destinationHost.id],
          source: idToHost[crowdedHost.id],
          sourceHost: crowdedHost,
          destinationHost,
          vm,
          hostsAverages,
          vmAverages,
          reason,
        })
      )
      // keep our local counts in sync so later VMs in this loop aren't checked against stale data
      this._adjustTagCounts(affinityCountsByHostId, affinityTags, crowdedHost.id, destinationHost.id)
      this._adjustTagCounts(antiAffinityCountsByHostId, antiAffinityTags, crowdedHost.id, destinationHost.id)

      if (hostsAverages[crowdedHost.id].memoryFree - memoryNeeded > this._thresholds.memoryFree.critical) {
        // wait for the freeing migrations to actually complete before reporting success: up to
        // `maxConcurrentMigrations` migrations can run concurrently, so callers relying on `success`
        // to migrate onto `crowdedHost` right away must not race the still-in-flight migrations
        await Promise.allSettled(promises)
        return { promises, success: true }
      }
    }

    // not enough VMs were migrated
    await Promise.allSettled(promises)
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
    reason,
  }) {
    // TODO: add more checks with XAPI method assert_can_migrate

    // Update tags and averages
    debug(
      `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destination.id} "${destination.name_label}") from Host (${source.id} "${source.name_label}").`
    )

    for (const tag of vm.tags) {
      if (tag in sourceHost.tagCounts) {
        sourceHost.tagCounts[tag]--
        destinationHost.tagCounts[tag]++
      }
    }

    const sourceAverages = hostsAverages[source.id]
    const destinationAverages = hostsAverages[destination.id]

    sourceAverages.cpu -= vmAverages.cpu
    destinationAverages.cpu += vmAverages.cpu

    sourceAverages.memoryFree += vmAverages.memory
    destinationAverages.memoryFree -= vmAverages.memory

    // Updating VM array to avoiding migrating the same VM twice
    delete sourceHost.vms[vm.id]

    // Migrate.
    return this._migrateVm({
      vm,
      xapiSrc: this.xo.getXapi(source),
      xapiDest: this.xo.getXapi(destination),
      srcHostId: sourceHost.id,
      destHostId: destination._xapiId,
      reason,
    })
  }

  _computeCoalitions(vms, affinityTags) {
    const coalitions = {}
    for (const tag of affinityTags) {
      coalitions[tag] = new Set([tag])
    }
    for (const vm of vms) {
      const vmAffinityTags = intersection(vm.tags, affinityTags)
      if (vmAffinityTags.length > 1) {
        // if VM has tag 'test' and 'prod', add both to 'test' coalition, and to 'prod' coalition
        for (const tag1 of vmAffinityTags) {
          for (const tag2 of vmAffinityTags) {
            coalitions[tag1].add(tag2)
          }
        }
      }
    }

    /* There might be some indirect links between tags
      For instance, if VM 1 has tags [A,B] and VM 2 has tags [B,C]
      tags A and B should be in the same coalition, but it's not detected yet.
      Currently we would have coalitions = {A: [A,B], B: [A,B,C], C: [B,C]}

      Following lines add the indirect links
    */

    for (const coalitionSet of Object.values(coalitions)) {
      coalitionSet.forEach(coalitionTag => {
        coalitions[coalitionTag].forEach(neighbourTag => {
          coalitionSet.add(neighbourTag)
        })
      })
    }

    // Convert Sets to arrays
    Object.keys(coalitions).forEach(tag => {
      coalitions[tag] = Array.from(coalitions[tag])
    })

    return coalitions
  }

  // ===================================================================
  // VM-to-host affinity
  // ===================================================================

  async _processVmToHostAffinity() {
    if (!this._vmToHostAffinityTags.length) {
      return
    }

    // process each pool independently: a VM must never be migrated to a host in a different pool to
    // satisfy vm-to-host affinity, since that would force a heavy storage-motion migration.
    // No pool parallelization because we're limited by the concurrent migration limiter.
    const allHosts = this._getHosts()
    const promises = []
    for (const poolId of this._poolIds) {
      const poolHosts = filter(allHosts, host => host.$poolId === poolId)
      if (poolHosts.length === 0) {
        continue
      }
      try {
        promises.push(...(await this._processVmToHostAffinityForHosts(poolHosts)))
      } catch (error) {
        warn(`vm-to-host affinity: failed to process pool ${poolId}`, { poolId, error })
      }
    }
    return Promise.allSettled(promises)
  }

  async _processVmToHostAffinityForHosts(allHosts) {
    const idToHost = keyBy(allHosts, 'id')

    // 1 - Check that every tagged VM has a preferred host sharing the same tag, otherwise assign one
    // this will prevent VMs from booting on a host on which they're not supposed to be
    const taggedVms = filter(
      this._getAllRunningVms(),
      vm => vm.$container in idToHost && intersection(vm.tags, this._vmToHostAffinityTags).length > 0
    )

    const limitAffinityUpdate = limitConcurrency(MAX_CONCURRENT_AFFINITY_UPDATES)()
    const affinityResults = await Promise.allSettled(
      taggedVms.map(vm =>
        limitAffinityUpdate(() => {
          // preserve the admin's configured tag order, so ambiguous cases resolve deterministically
          const vmTags = this._vmToHostAffinityTags.filter(tag => vm.tags.includes(tag))

          const preferredHost = idToHost[vm.affinityHost]
          if (preferredHost !== undefined && vmTags.some(tag => preferredHost.tags.includes(tag))) {
            return // preferred host already shares one of the VM's tags
          }

          // prefer hosts sharing ALL of the VM's tags, otherwise fall back to the first tag (in configured
          // order) that has a matching host: the VM's tags don't share a common host, so which host wins is
          // an arbitrary choice, and this should be avoided by the admin
          let candidateHosts = allHosts.filter(host => vmTags.every(tag => host.tags.includes(tag)))
          if (candidateHosts.length === 0) {
            if (vmTags.length > 1) {
              warn(
                `vm-to-host affinity: VM (${vm.id} "${vm.name_label}") has VM-to-host affinity tags (${vmTags}) with no host sharing all of them; this must be avoided.`
              )
            }
            const fallbackTag = vmTags.find(tag => allHosts.some(host => host.tags.includes(tag)))
            candidateHosts = fallbackTag === undefined ? [] : allHosts.filter(host => host.tags.includes(fallbackTag))
          }

          if (candidateHosts.length === 0) {
            debugVmToHostAffinity(`No host found with tag(s) ${vmTags} for VM (${vm.id} "${vm.name_label}").`)
            return
          }

          // pick randomly among candidates to avoid setting the same preferred host on all matching VMs
          const candidateHost = candidateHosts[Math.floor(Math.random() * candidateHosts.length)]

          debugVmToHostAffinity(
            `Setting preferred Host (${candidateHost.id} "${candidateHost.name_label}") for VM (${vm.id} "${vm.name_label}").`
          )
          const xapi = this.xo.getXapi(vm)
          return xapi.getObject(vm.id).set_affinity(xapi.getObject(candidateHost.id).$ref)
        })
      )
    )
    const failures = taggedVms
      .map((vm, i) => ({ vm, result: affinityResults[i] }))
      .filter(({ result }) => result.status === 'rejected')
    if (failures.length > 0) {
      warn('vm-to-host affinity: failed to set preferred host for some VMs', {
        vmIds: failures.map(({ vm }) => vm.id),
        errors: failures.map(({ result }) => result.reason),
      })
    }

    // 2 - get list of VMs which have a tag and are not on the right hosts
    const misplacedVms = filter(this._getAllRunningVms(), vm => {
      if (!(vm.$container in idToHost)) {
        return false
      }

      const vmTags = intersection(vm.tags, this._vmToHostAffinityTags)
      if (vmTags.length === 0) {
        return false
      }

      const currentHost = idToHost[vm.$container]
      return !vmTags.some(tag => currentHost.tags.includes(tag))
    })

    if (misplacedVms.length === 0) {
      return []
    }

    debugVmToHostAffinity(`Misplaced VMs: ${inspect(mapToArray(misplacedVms, 'id'), { depth: null })}`)

    // 3 - Migrate misplaced VMs if possible.
    const allVms = filter(this._getAllRunningVms(), vm => vm.$container in idToHost)
    const vmsAverages = await this._getVmsAverages(allVms, idToHost)
    const { averages: hostsAverages } = await this._getHostStatsAverages({ hosts: allHosts })

    const taggedHosts = this._getTaggedHosts({
      hosts: allHosts,
      tagList: this._vmToHostAffinityTags,
      vms: allVms,
      includeUntaggedVms: true,
    })
    const hostStructById = keyBy(taggedHosts.hosts, 'id')

    const promises = []
    for (const vm of misplacedVms) {
      if (!vm.xenTools) {
        debugVmToHostAffinity(`VM (${vm.id} "${vm.name_label}") does not support pool migration.`)
        continue
      }
      if (this._isVmInCooldown(vm)) {
        debugVmToHostAffinity(`VM (${vm.id} "${vm.name_label}") is in cooldown, skipping.`)
        continue
      }

      const vmTags = intersection(vm.tags, this._vmToHostAffinityTags)
      let eligibleHosts = allHosts.filter(host => vmTags.some(tag => host.tags.includes(tag)))
      // preferring hosts matching more tags, then hosts with more free resources
      eligibleHosts = sortBy(eligibleHosts, [
        host => -vmTags.filter(tag => host.tags.includes(tag)).length,
        host => -hostsAverages[host.id].memoryFree,
        host => hostsAverages[host.id].cpu,
      ])
      if (eligibleHosts.length === 0) {
        debugVmToHostAffinity(`No eligible host found for misplaced VM (${vm.id} "${vm.name_label}").`)
        continue
      }

      const vmAverages = vmsAverages[vm.id]

      // try to find an eligible host with enough free memory and CPU to receive the VM
      let destinationHost = eligibleHosts.find(host => {
        const destinationAverages = hostsAverages[host.id]
        return (
          destinationAverages.cpu + vmAverages.cpu <= this._thresholds.cpu.critical &&
          destinationAverages.memoryFree - vmAverages.memory >= this._thresholds.memoryFree.critical
        )
      })

      if (destinationHost === undefined) {
        // no eligible host currently has enough room: try to free up space on the best candidate
        const crowdedHost = eligibleHosts[0]
        debugVmToHostAffinity(
          `No eligible host has enough resources for VM (${vm.id} "${vm.name_label}"), trying to free up space on Host (${crowdedHost.id} "${crowdedHost.name_label}").`
        )

        const { promises: otherMigrationPromises, success } = await this._migrateOtherVms({
          crowdedHost: hostStructById[crowdedHost.id],
          hostsAverages,
          vmsAverages,
          idToHost,
          taggedHosts,
          memoryNeeded: vmAverages.memory,
          reason: `to free up resources on host to later migrate VM-to-host-affinity-tagged VMs to it (${vmTags.join(', ')})`,
        })
        promises.push(...otherMigrationPromises)

        if (!success) {
          debugVmToHostAffinity(
            `Could not free enough resources for VM (${vm.id} "${vm.name_label}"), leaving it on its current host.`
          )
          continue
        }
        // not a real race: destinationHost is a per-iteration local not touched by _migrateOtherVms or any concurrent call
        // eslint-disable-next-line require-atomic-updates
        destinationHost = crowdedHost
      }

      const matchingTags = vmTags.filter(tag => destinationHost.tags.includes(tag))

      promises.push(
        this._migrateVmAndUpdateInfos({
          destination: idToHost[destinationHost.id],
          source: idToHost[vm.$container],
          sourceHost: hostStructById[vm.$container],
          destinationHost: hostStructById[destinationHost.id],
          vm,
          hostsAverages,
          vmAverages,
          reason: `to satisfy VM-to-host affinity of tag(s) ${matchingTags.join(', ')}`,
        })
      )
    }

    return promises
  }
}
