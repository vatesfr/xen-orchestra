import filter from 'lodash.filter'
import intersection from 'lodash.intersection'
import uniq from 'lodash.uniq'
import { CronJob } from 'cron'
import { default as mapToArray } from 'lodash.map'

// ===================================================================

const MODE_PERFORMANCE = 0
const MODE_DENSITY = 1

const BEHAVIOR_LOW = 0
const BEHAVIOR_NORMAL = 1
const BEHAVIOR_AGGRESSIVE = 2

// Delay between each ressources evaluation in minutes.
// MIN: 1, MAX: 59.
const EXECUTION_DELAY = 1

// ===================================================================

export const configurationSchema = {
  type: 'object',

  properties: {
    plans: {
      type: 'array',
      title: 'plans',
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
            title: 'list of pools id where to apply the policy',

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
    const stats = await this._getStats(
      this._getHosts()
    )

    stats // FIXME
  }

  // Compute hosts for each pool. They can change over time.
  _getHosts () {
    const objects = filter(this.xo.getObjects(), { type: 'host' })
    const hosts = {}

    for (const poolUuid of this._objects) {
      hosts[poolUuid] = filter(objects, { uuid: poolUuid })
    }

    return hosts
  }

  async _getStats (hosts) {
    const promises = []

    for (const poolUuid of hosts) {
      promises.push(Promise.all(
        mapToArray(hosts[poolUuid], host =>
          this.xo.getXapiHostStats(host, 'seconds')
        )
      ))
    }

    return await Promise.all(promises)
  }
}

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
              ? MODE_PERFORMANCE
              : MODE_DENSITY

        const { behavior: planBehavior } = plan
        let behavior

        if (planBehavior.low) {
          behavior = BEHAVIOR_LOW
        } else if (planBehavior.normal) {
          behavior = BEHAVIOR_NORMAL
        } else {
          behavior = BEHAVIOR_AGGRESSIVE
        }

        this._addPlan({ name: plan.name, mode, behavior, poolIds: plan.pools })
      }
    }

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

  async _executePlans () {
    return (this._plansPromise = Promise.all(
      mapToArray(this._plans, plan => plan.execute())
    ))
  }
}

// ===================================================================

export default ({ xo }) => new LoadBalancerPlugin(xo)
