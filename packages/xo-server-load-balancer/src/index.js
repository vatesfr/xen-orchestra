import { createSchedule } from '@xen-orchestra/cron'
import { intersection, uniq } from 'lodash'

import DensityPlan from './density-plan'
import PerformancePlan from './performance-plan'
import SimplePlan from './simple-plan'
import { DEFAULT_CRITICAL_THRESHOLD_CPU, DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE } from './plan'
import { EXECUTION_DELAY, debug } from './utils'

// ===================================================================

const PERFORMANCE_MODE = 0
const DENSITY_MODE = 1

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
            title: 'Name',
          },

          mode: {
            enum: ['Performance mode', 'Density mode', 'Simple mode'],
            title: 'Mode',
          },

          pools: {
            type: 'array',
            description: 'list of pools where to apply the policy',

            items: {
              type: 'string',
              $type: 'Pool',
            },
          },

          thresholds: {
            type: 'object',
            title: 'Critical thresholds',

            properties: {
              cpu: {
                type: 'integer',
                title: 'CPU (%)',
                default: DEFAULT_CRITICAL_THRESHOLD_CPU,
              },
              memoryFree: {
                type: 'integer',
                title: 'RAM, Free memory (MB)',
                default: DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE,
              },
            },
          },

          excludedHosts: {
            type: 'array',
            title: 'Excluded hosts',
            description: 'list of hosts that are not affected by the plan',

            items: {
              type: 'string',
              $type: 'Host',
            },
          },

          antiAffinityTags: {
            type: 'array',
            title: 'Anti-affinity tags',
            description: 'list of VM tags to force place VMs on different hosts',

            items: {
              type: 'string',
              $type: 'Tag',
            },
          },
        },

        required: ['name', 'mode', 'pools'],
      },

      minItems: 1,
    },
    ignoredVmTags: {
      type: 'array',
      title: 'Ignored VM tags',
      description: 'list of VM tags to never migrate specific VMs',

      items: {
        type: 'string',
        $type: 'Tag',
      },
    },
  },

  additionalProperties: false,
}

// ===================================================================

class LoadBalancerPlugin {
  constructor(xo) {
    this.xo = xo

    this._job = createSchedule(`*/${EXECUTION_DELAY} * * * *`).createJob(async () => {
      try {
        await this._executePlans()
      } catch (error) {
        console.error('[WARN] scheduled function:', (error && error.stack) || error)
      }
    })
  }

  async configure({ plans, ignoredVmTags = [] }) {
    this._plans = []
    this._poolIds = [] // Used pools.
    this._globalOptions = { ignoredVmTags: new Set(ignoredVmTags) }

    if (plans) {
      for (const plan of plans) {
        this._addPlan(plan.mode === 'Performance mode' ? PERFORMANCE_MODE : DENSITY_MODE, plan)
      }
    }
  }

  load() {
    this._job.start()
  }

  unload() {
    this._job.stop()
  }

  _addPlan(mode, { name, pools, ...options }) {
    pools = uniq(pools)

    // Check already used pools.
    if (intersection(pools, this._poolIds).length > 0) {
      throw new Error(`Pool(s) already included in an other plan: ${pools}`)
    }

    this._poolIds = this._poolIds.concat(pools)
    let plan
    if (mode === PERFORMANCE_MODE) {
      plan = new PerformancePlan(this.xo, name, pools, options, this._globalOptions)
    } else if (mode === DENSITY_MODE) {
      plan = new DensityPlan(this.xo, name, pools, options, this._globalOptions)
    } else {
      plan = new SimplePlan(this.xo, name, pools, options, this._globalOptions)
    }
    this._plans.push(plan)
  }

  _executePlans() {
    debug('Execute plans!')

    return Promise.all(this._plans.map(plan => plan.execute()))
  }
}

// ===================================================================

export default ({ xo }) => new LoadBalancerPlugin(xo)
