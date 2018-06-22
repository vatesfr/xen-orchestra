import { filter, includes, map as mapToArray, size } from 'lodash'

import { EXECUTION_DELAY, debug } from './utils'

const MINUTES_OF_HISTORICAL_DATA = 30

// CPU threshold in percent.
export const DEFAULT_CRITICAL_THRESHOLD_CPU = 90.0

// Memory threshold in MB.
export const DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE = 64.0

// Thresholds factors.
const HIGH_THRESHOLD_FACTOR = 0.85
const LOW_THRESHOLD_FACTOR = 0.25

const HIGH_THRESHOLD_MEMORY_FREE_FACTOR = 1.25
const LOW_THRESHOLD_MEMORY_FREE_FACTOR = 20.0

const numberOrDefault = (value, def) => (value >= 0 ? value : def)

// ===================================================================
// Averages.
// ===================================================================

function computeAverage (values, nPoints) {
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

function computeRessourcesAverage (objects, objectsStats, nPoints) {
  const averages = {}

  for (const object of objects) {
    const { id } = object
    const { stats } = objectsStats[id]

    averages[id] = {
      cpu: computeAverage(
        mapToArray(stats.cpus, cpu => computeAverage(cpu, nPoints))
      ),
      nCpus: size(stats.cpus),
      memoryFree: computeAverage(stats.memoryFree, nPoints),
      memory: computeAverage(stats.memory, nPoints),
    }
  }

  return averages
}

function computeRessourcesAverageWithWeight (averages1, averages2, ratio) {
  const averages = {}

  for (const id in averages1) {
    const objectAverages = (averages[id] = {})

    for (const averageName in averages1[id]) {
      const average1 = averages1[id][averageName]
      if (average1 === undefined) {
        continue
      }

      objectAverages[averageName] =
        average1 * ratio + averages2[id][averageName] * (1 - ratio)
    }
  }

  return averages
}

function setRealCpuAverageOfVms (vms, vmsAverages, nCpus) {
  for (const vm of vms) {
    const averages = vmsAverages[vm.id]
    averages.cpu *= averages.nCpus / nCpus
  }
}

// ===================================================================

export default class Plan {
  constructor (xo, name, poolIds, { excludedHosts, thresholds } = {}) {
    this.xo = xo
    this._name = name
    this._poolIds = poolIds
    this._excludedHosts = excludedHosts
    this._thresholds = {
      cpu: {
        critical: numberOrDefault(
          thresholds && thresholds.cpu,
          DEFAULT_CRITICAL_THRESHOLD_CPU
        ),
      },
      memoryFree: {
        critical:
          numberOrDefault(
            thresholds && thresholds.memoryFree,
            DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE
          ) * 1024,
      },
    }

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

  execute () {
    throw new Error('Not implemented')
  }

  // ===================================================================
  // Get hosts to optimize.
  // ===================================================================

  async _findHostsToOptimize () {
    const hosts = this._getHosts()
    const hostsStats = await this._getHostsStats(hosts, 'minutes')

    // Check if a ressource's utilization exceeds threshold.
    const avgNow = computeRessourcesAverage(hosts, hostsStats, EXECUTION_DELAY)
    let toOptimize = this._checkRessourcesThresholds(hosts, avgNow)

    // No ressource's utilization problem.
    if (toOptimize.length === 0) {
      debug('No hosts to optimize.')
      return
    }

    // Check in the last 30 min interval with ratio.
    const avgBefore = computeRessourcesAverage(
      hosts,
      hostsStats,
      MINUTES_OF_HISTORICAL_DATA
    )
    const avgWithRatio = computeRessourcesAverageWithWeight(
      avgNow,
      avgBefore,
      0.75
    )

    toOptimize = this._checkRessourcesThresholds(toOptimize, avgWithRatio)

    // No ressource's utilization problem.
    if (toOptimize.length === 0) {
      debug('No hosts to optimize.')
      return
    }

    return {
      toOptimize,
      averages: avgWithRatio,
      hosts,
    }
  }

  _checkRessourcesThresholds () {
    throw new Error('Not implemented')
  }

  // ===================================================================
  // Get objects.
  // ===================================================================

  _getPlanPools () {
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
  _getHosts ({ powerState = 'Running' } = {}) {
    return filter(
      this.xo.getObjects(),
      object =>
        object.type === 'host' &&
        includes(this._poolIds, object.$poolId) &&
        object.power_state === powerState &&
        !includes(this._excludedHosts, object.id)
    )
  }

  async _getVms (hostId) {
    return filter(
      this.xo.getObjects(),
      object =>
        object.type === 'VM' &&
        object.power_state === 'Running' &&
        object.$container === hostId
    )
  }

  // ===================================================================
  // Get stats.
  // ===================================================================

  async _getHostsStats (hosts, granularity) {
    const hostsStats = {}

    await Promise.all(
      mapToArray(hosts, host =>
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

  async _getVmsStats (vms, granularity) {
    const vmsStats = {}

    await Promise.all(
      mapToArray(vms, vm =>
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

  async _getVmsAverages (vms, host) {
    const vmsStats = await this._getVmsStats(vms, 'minutes')
    const vmsAverages = computeRessourcesAverageWithWeight(
      computeRessourcesAverage(vms, vmsStats, EXECUTION_DELAY),
      computeRessourcesAverage(vms, vmsStats, MINUTES_OF_HISTORICAL_DATA),
      0.75
    )

    // Compute real CPU usage. Virtuals cpus to reals cpus.
    setRealCpuAverageOfVms(vms, vmsAverages, host.CPUs.cpu_count)

    return vmsAverages
  }
}
