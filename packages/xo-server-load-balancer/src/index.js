import EventEmitter from 'events'

import differenceBy from 'lodash.differenceby'
import eventToPromise from 'event-to-promise'
import filter from 'lodash.filter'
import includes from 'lodash.includes'
import intersection from 'lodash.intersection'
import uniq from 'lodash.uniq'

import { CronJob } from 'cron'
import { default as mapToArray } from 'lodash.map'

class Emitter extends EventEmitter {}

// ===================================================================

const noop = () => {}

const LOAD_BALANCER_DEBUG = 1
const debug = LOAD_BALANCER_DEBUG
  ? str => console.log(`[load-balancer]${str}`)
  : noop

// ===================================================================

const PERFORMANCE_MODE = 0
const DENSITY_MODE = 1

// Delay between each ressources evaluation in minutes.
// Must be less than MINUTES_OF_HISTORICAL_DATA.
const EXECUTION_DELAY = 1
const MINUTES_OF_HISTORICAL_DATA = 30

// CPU threshold in percent.
const DEFAULT_CRITICAL_THRESHOLD_CPU = 90.0

// Memory threshold in MB.
const DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE = 64.0

// Thresholds factors.
const HIGH_THRESHOLD_FACTOR = 0.85
const LOW_THRESHOLD_FACTOR = 0.25

const HIGH_THRESHOLD_MEMORY_FREE_FACTOR = 1.25
const LOW_THRESHOLD_MEMORY_FREE_FACTOR = 20.0

// ===================================================================

export const configurationSchema = {
  type: 'object',

  properties: {
    plans: {
      type: 'array',
      description: 'an array of plans',
      title: 'Plans',

      items: {
        type: 'object',
        title: 'Plan',

        properties: {
          name: {
            type: 'string',
            title: 'Name'
          },

          mode: {
            enum: [ 'Performance mode', 'Density mode' ],
            title: 'Mode'
          },

          pools: {
            type: 'array',
            $type: 'Pool',
            description: 'list of pools where to apply the policy'
          },

          thresholds: {
            type: 'object',
            title: 'Critical thresholds',

            properties: {
              cpu: {
                type: 'integer',
                title: 'CPU (%)',
                description: 'default: 90%'
              },
              memoryFree: {
                type: 'integer',
                title: 'RAM, Free memory (MB)',
                description: 'default: 64MB'
              }
            }
          },

          excludedHosts: {
            type: 'array',
            title: 'Excluded hosts',
            $type: 'Host',
            description: 'list of hosts that are not affected by the plan'
          }
        },

        required: [ 'name', 'mode', 'pools' ]
      },

      minItems: 1
    }
  },

  additionalProperties: false
}

// ===================================================================

// Create a job not enabled by default.
// A job is a cron task, a running and enabled state.
const makeJob = (cronPattern, fn) => {
  const job = {
    running: false,
    emitter: new Emitter()
  }

  job.cron = new CronJob(cronPattern, async () => {
    if (job.running) {
      return
    }

    job.running = true

    try {
      await fn()
    } catch (error) {
      console.error('[WARN] scheduled function:', error && error.stack || error)
    } finally {
      job.running = false
      job.emitter.emit('finish')
    }
  })

  job.isEnabled = () => job.cron.running

  return job
}

// Compare a list of objects and give the best.
function searchObject (objects, fun) {
  let object = objects[0]

  for (let i = 1; i < objects.length; i++) {
    if (fun(object, objects[i]) > 0) {
      object = objects[i]
    }
  }

  return object
}

function sortHostsByPool (hosts) {
  const struct = {}

  for (const host of hosts) {
    const poolId = host.$poolId
    let pool = struct[poolId]

    if (pool === undefined) {
      pool = struct[poolId] = []
    }

    pool.push(host)
  }

  return struct
}

// ===================================================================
// Averages.
// ===================================================================

function computeAverage (values, nPoints = values.length) {
  let sum = 0
  let tot = 0

  const { length } = values

  for (let i = length - nPoints; i < length; i++) {
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
    const objectAverages = averages[id] = {}

    objectAverages.cpu = computeAverage(
      mapToArray(stats.cpus, cpu => computeAverage(cpu, nPoints))
    )
    objectAverages.nCpus = stats.cpus.length

    objectAverages.memoryFree = computeAverage(stats.memoryFree, nPoints)
    objectAverages.memory = computeAverage(stats.memory, nPoints)
  }

  return averages
}

function computeRessourcesAverageWithWeight (averages1, averages2, ratio) {
  const averages = {}

  for (const id in averages1) {
    const objectAverages = averages[id] = {}

    for (const averageName in averages1[id]) {
      objectAverages[averageName] = averages1[id][averageName] * ratio + averages2[id][averageName] * (1 - ratio)
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

const numberOrDefault = (value, def) => (value >= 0) ? value : def

class Plan {
  constructor (xo, name, poolIds, {
    excludedHosts,
    thresholds
  } = {}) {
    this.xo = xo
    this._name = name
    this._poolIds = poolIds
    this._excludedHosts = excludedHosts
    this._thresholds = {
      cpu: {
        critical: numberOrDefault(thresholds.cpu, DEFAULT_CRITICAL_THRESHOLD_CPU)
      },
      memoryFree: {
        critical: numberOrDefault(thresholds.memoryFree, DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE) * 1024
      }
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
    const avgBefore = computeRessourcesAverage(hosts, hostsStats, MINUTES_OF_HISTORICAL_DATA)
    const avgWithRatio = computeRessourcesAverageWithWeight(avgNow, avgBefore, 0.75)

    toOptimize = this._checkRessourcesThresholds(toOptimize, avgWithRatio)

    // No ressource's utilization problem.
    if (toOptimize.length === 0) {
      debug('No hosts to optimize.')
      return
    }

    return {
      toOptimize,
      averages: avgWithRatio,
      hosts
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
  _getHosts () {
    return differenceBy(
      filter(this.xo.getObjects(), object =>
        object.type === 'host' && includes(this._poolIds, object.$poolId)
      ),
      this._excludedHosts,
      val => val.id || val
    )
  }

  async _getVms (hostId) {
    return filter(this.xo.getObjects(), object =>
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

    await Promise.all(mapToArray(hosts, host =>
      this.xo.getXapiHostStats(host, granularity).then(hostStats => {
        hostsStats[host.id] = {
          nPoints: hostStats.stats.cpus[0].length,
          stats: hostStats.stats,
          averages: {}
        }
      })
    ))

    return hostsStats
  }

  async _getVmsStats (vms, granularity) {
    const vmsStats = {}

    await Promise.all(mapToArray(vms, vm =>
      this.xo.getXapiVmStats(vm, granularity).then(vmStats => {
        vmsStats[vm.id] = {
          nPoints: vmStats.stats.cpus[0].length,
          stats: vmStats.stats,
          averages: {}
        }
      })
    ))

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

// ===================================================================

class PerformancePlan extends Plan {
  constructor (xo, name, poolIds, options) {
    super(xo, name, poolIds, options)
  }

  _checkRessourcesThresholds (objects, averages) {
    return filter(objects, object => {
      const objectAverages = averages[object.id]

      return (
        objectAverages.cpu >= this._thresholds.cpu.high ||
        objectAverages.memoryFree <= this._thresholds.memoryFree.high
      )
    })
  }

  async execute () {
    const results = await this._findHostsToOptimize()

    if (!results) {
      return
    }

    const {
      averages,
      hosts,
      toOptimize
    } = results

    const exceededHost = searchObject(toOptimize, (a, b) => {
      a = averages[a.id]
      b = averages[b.id]

      return (b.cpu - a.cpu) || (a.memoryFree - b.memoryFree)
    })

    // Search bests combinations for the worst host.
    await this._optimize({
      exceededHost,
      hosts: filter(hosts, host => host.id !== exceededHost.id),
      hostsAverages: averages
    })
  }

  async _optimize ({ exceededHost, hosts, hostsAverages }) {
    const vms = await this._getVms(exceededHost.id)
    const vmsAverages = await this._getVmsAverages(vms, exceededHost)

    // Sort vms by cpu usage. (higher to lower)
    vms.sort((a, b) =>
      vmsAverages[b.id].cpu - vmsAverages[a.id].cpu
    )

    const exceededAverages = hostsAverages[exceededHost.id]
    const promises = []

    const xapiSrc = this.xo.getXapi(exceededHost)

    for (const vm of vms) {
      // Search host with lower cpu usage.
      const destination = searchObject(hosts, (a, b) =>
        hostsAverages[b.id].cpu - hostsAverages[a.id].cpu
      )
      const destinationAverages = hostsAverages[destination.id]
      const vmAverages = vmsAverages[vm.id]

      // Unable to move the vm.
      if (
        exceededAverages.cpu - vmAverages.cpu < destinationAverages.cpu + vmAverages.cpu ||
        destinationAverages.memoryFree > vmAverages.memory
      ) {
        continue
      }

      exceededAverages.cpu -= vmAverages.cpu
      destinationAverages.cpu += vmAverages.cpu

      exceededAverages.memoryFree += vmAverages.memory
      destinationAverages.memoryFree -= vmAverages.memory

      debug(`Migrate VM (${vm.id}) to Host (${destination.id}) from Host (${exceededHost.id})`)

      // promises.push(
      //   xapiSrc.migrateVm(vm._xapiId, this.xo.getXapi(destination), destination._xapiId)
      // )
    }

    await Promise.all(promises)

    return
  }
}

// ===================================================================

class DensityPlan extends Plan {
  constructor (xo, name, poolIds, options) {
    super(xo, name, poolIds, options)
  }

  _checkRessourcesThresholds (objects, averages) {
    return filter(objects, object =>
      averages[object.id].cpu < this._thresholds.cpu.high
    )
  }

  async execute () {
    const results = await this._findHostsToOptimize()

    if (!results) {
      return
    }

    const {
      averages: hostsAverages,
      hosts
    } = results
    let { toOptimize } = results

    const pools = await this._getPlanPools()
    const hostsByPool = sortHostsByPool(hosts)

    // Remove masters from toOptimize and hosts.
    for (const poolId in hostsByPool) {
      const pool = hostsByPool[poolId]
      hostsByPool[poolId] = filter(pool, host => host.id !== pool.master)
    }
    toOptimize = differenceBy(toOptimize, pools, object => {
      object.type === 'host' ? object.id : object.master
    })

    // Optimize all masters.
    await Promise.all(
      mapToArray(hostsByPool, (hosts, poolId) => {
        this._optimizeMaster({ toOptimize, pool: pools[poolId], hosts, hostsAverages })
      })
    )

    // Optimize master.
    console.log(hosts)
  }

    async _optimizeMaster ({ toOptimize, pool, hosts, hostsAverages }) {
    // TODO
    throw new Error('Not yet implemented')
  }
}

// ===================================================================
// ===================================================================

class LoadBalancerPlugin {
  constructor (xo) {
    this.xo = xo
    this._job = makeJob(`*/${EXECUTION_DELAY} * * * *`, ::this._executePlans)
    this._emitter
  }

  async configure ({ plans }) {
    const job = this._job
    const enabled = job.isEnabled()

    if (enabled) {
      job.cron.stop()
    }

    // Wait until all old plans stopped running.
    if (job.running) {
      await eventToPromise(job.emitter, 'finish')
    }

    this._plans = []
    this._poolIds = [] // Used pools.

    if (plans) {
      for (const plan of plans) {
        this._addPlan(plan.mode === 'Performance mode' ? PERFORMANCE_MODE : DENSITY_MODE, plan)
      }
    }

    if (enabled) {
      job.cron.start()
    }
  }

  load () {
    this._job.cron.start()
  }

  unload () {
    this._job.cron.stop()
  }

  _addPlan (mode, { name, pools, ...options }) {
    pools = uniq(pools)

    // Check already used pools.
    if (intersection(pools, this._poolIds).length > 0) {
      throw new Error(`Pool(s) already included in an other plan: ${pools}`)
    }

    this._poolIds = this._poolIds.concat(pools)
    this._plans.push(mode === PERFORMANCE_MODE
      ? new PerformancePlan(this.xo, name, pools, options)
      : new DensityPlan(this.xo, name, pools, options)
    )
  }

  _executePlans () {
    debug('Execute plans !')

    return Promise.all(
      mapToArray(this._plans, plan => plan.execute())
    )
  }
}

// ===================================================================

export default ({ xo }) => new LoadBalancerPlugin(xo)
