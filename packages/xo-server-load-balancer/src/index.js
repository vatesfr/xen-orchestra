import filter from 'lodash.filter'
import intersection from 'lodash.intersection'
import uniq from 'lodash.uniq'
import { CronJob } from 'cron'
import { default as mapToArray } from 'lodash.map'

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
              performance: { type: 'string' },
              density: { type: 'string' }
            },

            oneOf: [
              { required: ['performance'] },
              { required: ['density'] }
            ]
          },
          behavior: {
            type: 'object',

            properties: {
              low: { type: 'string' },
              normal: { type: 'string' },
              aggressive: { type: 'string' }
            },

            oneOf: [
              { required: ['low'] },
              { required: ['normal'] },
              { required: ['aggressive'] }
            ]
          }
        }
      },
      minItems: 1,
      uniqueItems: true
    }
  },

  additionalProperties: false
}

// ===================================================================

const BALANCING_MODE_PERFORMANCE = 0

// Delay between each ressources evaluation in minutes.
// MIN: 1, MAX: 59.
const EXECUTION_DELAY = 1

export const makeCronJob = (cronPattern, fn) => {
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

class Plan {
  constructor (xo, poolUuids, {
    mode = BALANCING_MODE_PERFORMANCE
  } = {}) {
    this.xo = xo
    this._mode = mode
    this._poolUuids = poolUuids
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
    this._plans = []
    this._poolUuids = [] // Used pools.
  }

  configure ({...conf}) {
    this._cronJob = makeCronJob(`*/${EXECUTION_DELAY} * * * *`, ::this._executePlans)
  }

  load () {
    this._cronJob.start()
  }

  unload () {
    this._cronJob.stop()
  }

  addPlan (name, poolUuids, mode, behavior) {
    poolUuids = uniq(poolUuids)

    // Check already used pools.
    if (intersection(poolUuids, this._poolUuids) > 0) {
      throw new Error(`Pool(s) already included in an other plan: ${poolUuids}`)
    }

    this._plans.push(new Plan(this.xo, poolUuids))
  }

  async _executePlans () {
    await Promise.all(
      mapToArray(this._plans, plan => plan.execute())
    )
  }
}

// ===================================================================

export default ({ xo }) => new LoadBalancerPlugin(xo)
