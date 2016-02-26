import filter from 'lodash.filter'
import intersection from 'lodash.intersection'
import uniq from 'lodash.uniq'
import includes from 'lodash.includes'
import { CronJob } from 'cron'
import { default as mapToArray } from 'lodash.map'

// ===================================================================

const PERFORMANCE_MODE = 0
const DENSITY_MODE = 1

const LOW_BEHAVIOR = 0
const NORMAL_BEHAVIOR = 1
const AGGRESSIVE_BEHAVIOR = 2

// Delay between each ressources evaluation in minutes.
// Must be less than MINUTES_OF_HISTORICAL_DATA.
const EXECUTION_DELAY = 1
const MINUTES_OF_HISTORICAL_DATA = 30

// Threshold cpu in percent.
// const CRITICAL_THRESHOLD_CPU = 90
const HIGH_THRESHOLD_CPU = 76.5
// const LOW_THRESHOLD_CPU = 22.5

// const CRITICAL_THRESHOLD_FREE_MEMORY = 51
const HIGH_THRESHOLD_FREE_MEMORY = 63.75
// const LOW_THRESHOLD_FREE_MEMORY = 1020

// ===================================================================

export const configurationSchema = {
  type: 'object',

  properties: {
    plans: {
      type: 'array',
      description: 'an array of plans',

      items: {
        type: 'object',
        title: 'plan',

        properties: {
          name: {
            type: 'string'
          },

          mode: {
            type: 'object',

            properties: {
              performance: { type: 'boolean' },
              density: { type: 'boolean' }
            },

            oneOf: [
              { required: ['performance'] },
              { required: ['density'] }
            ]
          },

          behavior: {
            type: 'object',

            properties: {
              low: { type: 'boolean' },
              normal: { type: 'boolean' },
              aggressive: { type: 'boolean' }
            },

            oneOf: [
              { required: ['low'] },
              { required: ['normal'] },
              { required: ['aggressive'] }
            ]
          },

          pools: {
            type: 'array',
            description: 'list of pools id where to apply the policy',

            items: {
              type: 'string',
              $objectType: 'pool'
            },

            minItems: 1,
            uniqueItems: true
          }
        }
      },
      minItems: 1
    }
  },

  additionalProperties: false
}

// ===================================================================

const makeCronJob = (cronPattern, fn) => {
  let running

  const job = new CronJob(cronPattern, async () => {
    if (running) {
      return
    }

    running = true

    try {
      await fn()
    } catch (error) {
      console.error('[WARN] scheduled function:', error && error.stack || error)
    } finally {
      running = false
    }
  })

  return job
}

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

function computeRessourcesAverage (hosts, hostsStats, nPoints) {
  const averages = {}

  for (const host of hosts) {
    const hostId = host.id
    const hostAverages = averages[hostId] = {}
    const { stats } = hostsStats[hostId]

    hostAverages.cpus = computeAverage(
      mapToArray(stats.cpus, cpu => computeAverage(cpu, nPoints))
    )
    hostAverages.memoryFree = computeAverage(stats.memoryFree, nPoints)
  }

  return averages
}

function checkRessourcesThresholds (hosts, averages) {
  return filter(hosts, host => {
    const hostAverages = averages[host.id]

    return (
      hostAverages.cpus >= HIGH_THRESHOLD_CPU ||
      hostAverages.memoryFree >= HIGH_THRESHOLD_FREE_MEMORY
    )
  })
}

function computeRessourcesAverageWithRatio (hosts, averages1, averages2, ratio) {
  const averages = {}

  for (const host of hosts) {
    const hostId = host.id
    const hostAverages = averages[hostId] = {}

    for (const averageName in hostAverages) {
      hostAverages[averageName] = averages1[averageName] * ratio + averages2[averageName] * (1 - ratio)
    }
  }

  return averages
}

// ===================================================================

class Plan {
  constructor (xo, { name, mode, behavior, poolIds }) {
    this.xo = xo
    this._name = name // Useful ?
    this._mode = mode
    this._behavior = behavior
    this._poolIds = poolIds
  }

  async execute () {
    if (this._mode === PERFORMANCE_MODE) {
      await this._executeInPerformanceMode()
    } else {
      await this._executeInDensityMode()
    }
  }

  async _executeInPerformanceMode () {
    const hosts = this._getHosts()
    const hostsStats = await this._getHostsStats(hosts, 'minutes')

    // 1. Check if a ressource's utilization exceeds threshold.
    const avgNow = computeRessourcesAverage(hosts, hostsStats, EXECUTION_DELAY)
    let exceededHosts = checkRessourcesThresholds(hosts, avgNow)

    // No ressource's utilization problem.
    if (exceededHosts.length === 0) {
      return
    }

    // 2. Check in the last 30 min interval with ratio.
    const avgBefore = computeRessourcesAverage(hosts, hostsStats, MINUTES_OF_HISTORICAL_DATA)
    const avgWithRatio = computeRessourcesAverageWithRatio(exceededHosts, avgNow, avgBefore, 0.75)
    exceededHosts = checkRessourcesThresholds(exceededHosts, avgWithRatio)

    // No ressource's utilization problem.
    if (exceededHosts.length === 0) {
      return
    }

    // 3. Reorder the exceeded hosts by priority.
    exceededHosts.sort((a, b) => {
      a = avgWithRatio[a.id]
      b = avgWithRatio[b.id]

      return (b.cpus - a.cpus) || (a.memoryFree - b.memoryFree)
    })

    // 4. Search bests combinations for the worst host.
    const optimizations = await this._computeOptimizations(exceededHosts[0], {
      now: avgNow,
      before: avgBefore,
      withRatio: avgWithRatio
    })

    // 5. Apply optimizations if necessary.
    await this._applyOptimizations(optimizations)
  }

  async _executeInDensityMode () {
    throw new Error('not yet implemented')
  }

  async _computeOptimizations (exceededHost, hostsAverages) {
    // Get the vms and stats from exceeded hosts.
    const vms = await this._getVms(exceeded)
    const vmsStats = await this._getVmsStats(vms, 'minutes')

    // TODO
  }

  async _applyOptimizations (optimizations) {
    throw new Error('not yet implemented')
  }

  // Compute hosts for each pool. They can change over time.
  _getHosts () {
    return filter(this.xo.getObjects(), object =>
      object.type === 'host' && includes(this._poolIds, object.$poolId)
    )
  }

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

  async _getVms (hosts) {
    const objects = this.xo.getObjects()
    const vms = {}

    for (const host of hosts) {
      const { id } = host

      vms[id] = filter(objects, object =>
        object.type === 'VM' &&
        object.power_state === 'Running' &&
        object.$container === id
      )
    }

    return vms
  }

  async _getVmsStats (vms, granularity) {
    const promises = []
    const vmsStats = {}

    for (const hostId in vms) {
      const hostVmsStats = vmsStats[hostId] = {}

      promises.push(
        Promise.all(mapToArray(vms[hostId], vm =>
          this.xo.getXapiVmStats(vm, granularity).then(vmStats => {
            hostVmsStats[vm.id] = {
              nPoints: vmStats.stats.cpus[0].length,
              stats: vmStats.stats,
              averages: {}
            }
          })
        ))
      )
    }

    await Promise.all(promises)

    return vmsStats
  }
}

// ===================================================================

class LoadBalancerPlugin {
  constructor (xo) {
    this.xo = xo
    this._cronJob = makeCronJob(`*/${EXECUTION_DELAY} * * * *`, ::this._executePlans)
  }

  async configure ({ plans }) {
    const cronJob = this._cronJob
    const enabled = cronJob.running

    if (enabled) {
      cronJob.stop()
    }

    // Wait until all old plans stopped running.
    await this._plansPromise

    this._plans = []
    this._poolIds = [] // Used pools.

    if (plans) {
      for (const plan of plans) {
        const mode = plan.mode.performance
          ? PERFORMANCE_MODE
          : DENSITY_MODE

        const { behavior: planBehavior } = plan
        let behavior

        if (planBehavior.low) {
          behavior = LOW_BEHAVIOR
        } else if (planBehavior.normal) {
          behavior = NORMAL_BEHAVIOR
        } else {
          behavior = AGGRESSIVE_BEHAVIOR
        }

        this._addPlan({ name: plan.name, mode, behavior, poolIds: plan.pools })
      }
    }

    // TMP
    this._addPlan({
      name: 'Test plan',
      mode: PERFORMANCE_MODE,
      behavior: AGGRESSIVE_BEHAVIOR,
      poolIds: [ '313624ab-0958-bb1e-45b5-7556a463a10b' ]
    })

    if (enabled) {
      cronJob.start()
    }
  }

  load () {
    this._cronJob.start()
  }

  unload () {
    this._cronJob.stop()
  }

  _addPlan (plan) {
    const poolIds = plan.poolIds = uniq(plan.poolIds)

    // Check already used pools.
    if (intersection(poolIds, this._poolIds) > 0) {
      throw new Error(`Pool(s) already included in an other plan: ${poolIds}`)
    }

    this._plans.push(new Plan(this.xo, plan))
  }

  _executePlans () {
    return (this._plansPromise = Promise.all(
      mapToArray(this._plans, plan => plan.execute())
    ))
  }
}

// ===================================================================

export default ({ xo }) => new LoadBalancerPlugin(xo)
