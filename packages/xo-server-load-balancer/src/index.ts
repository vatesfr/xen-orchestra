import { createSchedule } from '@xen-orchestra/cron'
import lodash from 'lodash'
const { intersection, uniq } = lodash
import { limitConcurrency } from 'limit-concurrency-decorator'

import DensityPlan from './density-plan.js'
import PerformancePlan from './performance-plan.js'
import SimplePlan from './simple-plan.js'
import { DEFAULT_CRITICAL_THRESHOLD_CPU, DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE } from './plan.js'
import { EXECUTION_DELAY, debug } from './utils.js'
import type { Xo, GlobalOptions, ConcurrencyLimiter } from './plan.js'

// ===================================================================

const PERFORMANCE_MODE = 0
const DENSITY_MODE = 1
const SIMPLE_MODE = 2
const MODES: Record<string, number> = {
  'Performance mode': PERFORMANCE_MODE,
  'Density mode': DENSITY_MODE,
  'Simple mode': SIMPLE_MODE,
}

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
            enum: Object.keys(MODES),
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

          affinityTags: {
            type: 'array',
            title: 'Affinity tags',
            description: 'list of VM tags to force place VMs on same hosts',

            items: {
              type: 'string',
              $type: 'Tag',
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

          // balanceVcpus is an incorrect name kept for compatibility with past configurationSchema
          balanceVcpus: {
            enum: [false, 'preventive', true],
            enumNames: [
              'Conservative: only balance hosts when exceeding CPU or memory thresholds (default)',
              'Preventive: balance hosts when exceeding thresholds and when pool CPU values are too disparate',
              'vCPU balancing: balance hosts when exceeding thresholds and pre-position VMs on hosts to balance vCPU/CPU ratio',
            ],
            title: 'Performance plan behaviour',
            description: 'Optional features for performance plan',
            default: false,
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
    advanced: {
      title: 'Advanced',
      type: 'object',
      default: {},
      properties: {
        maxConcurrentMigrations: {
          default: 2,
          description: 'Limit maximum number of simultaneous migrations for faster migrations',
          minimum: 1,
          title: 'Maximum concurrent migrations',
          type: 'integer',
        },
        migrationCooldown: {
          default: 30,
          description: 'Minimum time (in minutes) before a VM can be migrated again',
          minimum: 0,
          title: 'Migration cooldown',
          type: 'integer',
        },
      },
    },
  },

  additionalProperties: false,
}

// ===================================================================

interface PlanConfig {
  name: string
  mode: string
  pools: string[]
  thresholds?: { cpu?: number; memoryFree?: number }
  excludedHosts?: string[]
  affinityTags?: string[]
  antiAffinityTags?: string[]
  balanceVcpus?: false | 'preventive' | true
}

interface PluginConfig {
  plans?: PlanConfig[]
  advanced?: { maxConcurrentMigrations?: number; migrationCooldown?: number }
  ignoredVmTags?: string[]
}

class LoadBalancerPlugin {
  xo: Xo
  _migrationHistory: Map<string, number>
  _plans: Array<PerformancePlan | DensityPlan | SimplePlan>
  _poolIds: string[]
  _globalOptions!: GlobalOptions
  _concurrentMigrationLimiter!: ConcurrencyLimiter
  _job: ReturnType<ReturnType<typeof createSchedule>['createJob']>

  constructor(xo: Xo) {
    this.xo = xo
    this._migrationHistory = new Map()
    this._plans = []
    this._poolIds = []

    this._job = createSchedule(`*/${EXECUTION_DELAY} * * * *`).createJob(async () => {
      try {
        await this._executePlans()
      } catch (error) {
        console.error('[WARN] scheduled function:', (error as Error)?.stack ?? error)
      }
    })
  }

  async configure({ plans, advanced = {}, ignoredVmTags = [] }: PluginConfig): Promise<void> {
    this._plans = []
    this._poolIds = []
    this._globalOptions = {
      ignoredVmTags: new Set(ignoredVmTags),
      migrationCooldown: (advanced.migrationCooldown ?? 30) * 60 * 1000,
      migrationHistory: this._migrationHistory,
    }
    this._concurrentMigrationLimiter = limitConcurrency(advanced.maxConcurrentMigrations ?? 2)()

    if (plans) {
      for (const plan of plans) {
        this._addPlan(MODES[plan.mode], plan)
      }
    }
  }

  load(): void {
    this._job.start()
  }

  unload(): void {
    this._job.stop()
  }

  _addPlan(mode: number, { name, pools, ...options }: PlanConfig): void {
    pools = uniq(pools)

    if (intersection(pools, this._poolIds).length > 0) {
      throw new Error(`Pool(s) already included in another plan: ${pools}`)
    }

    this._poolIds = this._poolIds.concat(pools)
    let plan: PerformancePlan | DensityPlan | SimplePlan
    if (mode === PERFORMANCE_MODE) {
      plan = new PerformancePlan(this.xo, name, pools, options, this._globalOptions, this._concurrentMigrationLimiter)
    } else if (mode === DENSITY_MODE) {
      plan = new DensityPlan(this.xo, name, pools, options, this._globalOptions, this._concurrentMigrationLimiter)
    } else {
      plan = new SimplePlan(this.xo, name, pools, options, this._globalOptions, this._concurrentMigrationLimiter)
    }
    this._plans.push(plan)
  }

  _executePlans(): Promise<void[]> {
    debug('Execute plans!')

    return Promise.all(this._plans.map(plan => plan.execute()))
  }
}

// ===================================================================

export default ({ xo }: { xo: Xo }) => new LoadBalancerPlugin(xo)
