import { createSchedule } from '@xen-orchestra/cron'
import { intersection, uniq } from 'lodash'
import { limitConcurrency } from 'limit-concurrency-decorator'
import type { XoApp, XoVm } from '@vates/types'

type RestApiRequest = { params: Record<string, string>; body: unknown; query: Record<string, string | undefined> }
type RestApiSpec = { [key: string]: RestApiSpec | ((req: RestApiRequest) => unknown) }
type XoAppWithRestApi = XoApp & { registerRestApi(spec: RestApiSpec, base?: string): () => void }

import DensityPlan from './density-plan.mjs'
import PerformancePlan from './performance-plan.mjs'
import SimplePlan from './simple-plan.mjs'
import { DEFAULT_CRITICAL_THRESHOLD_CPU, DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE, type GlobalOptions, type PlanOptions } from './plan.mjs'
import { EXECUTION_DELAY, debug } from './utils.mjs'

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

          // when UI will allow it, put balanceVcpu option outside performance mode
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

interface PlanConfig extends PlanOptions {
  name: string
  pools: string[]
  mode: string
}

interface PluginConfig {
  plans?: PlanConfig[]
  advanced: {
    maxConcurrentMigrations?: number
    migrationCooldown?: number
  }
  ignoredVmTags?: string[]
}

type ConcurrentMigrationLimiter = (this: object, methodName: string, ...args: unknown[]) => Promise<unknown>

class LoadBalancerPlugin {
  xo: XoAppWithRestApi
  _migrationHistory: Map<string, number>
  _plans: (DensityPlan | PerformancePlan | SimplePlan)[]
  _poolIds: string[]
  _globalOptions!: GlobalOptions
  _concurrentMigrationLimiter!: ConcurrentMigrationLimiter
  _job: { start(): void; stop(): void }
  _unregisterRestApi?: () => void

  constructor(xo: XoAppWithRestApi) {
    this.xo = xo
    this._migrationHistory = new Map() // vmId -> timestamp of last migration
    this._plans = []
    this._poolIds = []

    this._job = createSchedule(`*/${EXECUTION_DELAY} * * * *`).createJob(async () => {
      try {
        await this._executePlans()
      } catch (error) {
        console.error('[WARN] scheduled function:', (error && (error as Error).stack) || error)
      }
    })
  }

  configure({ plans, advanced, ignoredVmTags = [] }: PluginConfig): void {
    this._plans = []
    this._poolIds = [] // Used pools.
    this._globalOptions = {
      ignoredVmTags: new Set(ignoredVmTags),
      migrationCooldown: (advanced.migrationCooldown ?? 30) * 60 * 1000, // convert to ms
      migrationHistory: this._migrationHistory,
    }
    this._concurrentMigrationLimiter = limitConcurrency(advanced.maxConcurrentMigrations ?? 2)()

    if (plans) {
      for (const plan of plans) {
        this._addPlan(MODES[plan.mode] ?? SIMPLE_MODE, plan)
      }
    }
  }

  load(): void {
    this._job.start()
    this._unregisterRestApi = this.xo.registerRestApi(
      {
        pools: {
          ':poolId': {
            'load-balancer': {
              _post: (req: RestApiRequest) => {
                const poolId = req.params['poolId']
                if (poolId === undefined) throw new Error('missing poolId')
                const body = req.body as { plan: Omit<PlanConfig, 'pools' | 'name'>; dryRun?: boolean }
                const planConfig: PlanConfig = { name: 'rest-api', pools: [poolId], ...body.plan }
                return this.loadBalancer(planConfig, { dryRun: body.dryRun ?? true })
              },
            },
          },
        },
      },
      '/plugins/load-balancer'
    )
  }

  unload(): void {
    this._job.stop()
    this._unregisterRestApi?.()
  }

  _addPlan(mode: number, { name, pools, ...options }: PlanConfig): void {
    pools = uniq(pools)

    // Check already used pools.
    if (intersection(pools, this._poolIds).length > 0) {
      throw new Error(`Pool(s) already included in another plan: ${pools}`)
    }

    this._poolIds = this._poolIds.concat(pools)
    let plan: DensityPlan | PerformancePlan | SimplePlan
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

  async loadBalancer(planConfig: PlanConfig, { dryRun = true } = {}): Promise<Record<XoVm['id'], string>> {
    const dryRunResult = new Map<string, string>()
    const mode = MODES[planConfig.mode] ?? PERFORMANCE_MODE
    const globalOptions: GlobalOptions = {
      ignoredVmTags: this._globalOptions?.ignoredVmTags ?? new Set(),
      migrationCooldown: 0,
      migrationHistory: new Map(),
    }
    const limiter: ConcurrentMigrationLimiter = this._concurrentMigrationLimiter ?? limitConcurrency(1)()
    const opts: PlanOptions = { ...planConfig, dryRunResult: dryRun ? dryRunResult : undefined }

    let plan: DensityPlan | PerformancePlan | SimplePlan
    if (mode === PERFORMANCE_MODE) {
      plan = new PerformancePlan(this.xo, planConfig.name, planConfig.pools, opts, globalOptions, limiter)
    } else if (mode === DENSITY_MODE) {
      plan = new DensityPlan(this.xo, planConfig.name, planConfig.pools, opts, globalOptions, limiter)
    } else {
      plan = new SimplePlan(this.xo, planConfig.name, planConfig.pools, opts, globalOptions, limiter)
    }

    await plan.execute()
    return Object.fromEntries(dryRunResult) as Record<XoVm['id'], string>
  }
}

// ===================================================================

export default ({ xo }: { xo: XoApp }) => new LoadBalancerPlugin(xo as XoAppWithRestApi)
