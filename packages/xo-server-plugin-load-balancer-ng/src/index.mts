import type { IncomingMessage } from 'node:http'
import { createSchedule } from '@xen-orchestra/cron'
import { createLogger } from '@xen-orchestra/log'
import type { XoHost } from '@vates/types'
import type { XoApp } from '@vates/types'
import type { XoAppWithRestApi } from './xo-types-augment.mjs'

import DensityPlan from './density-plan.mjs'
import PerformancePlan from './performance-plan.mjs'
import SimplePlan from './simple-plan.mjs'
import Plan, {
  DEFAULT_CRITICAL_THRESHOLD_CPU,
  DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE,
  EXECUTION_DELAY,
  Semaphore,
} from './plan.mjs'
import type { GlobalOptions, PlanOptions, ProposedMigration } from './types.mjs'

const log = createLogger('xo:load-balancer-ng')

// ===================================================================
// Mode constants
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
// Configuration schema (JSON Schema for XO-Server plugin settings)
// ===================================================================

export const configurationSchema = {
  type: 'object',
  additionalProperties: false,

  properties: {
    plans: {
      type: 'array',
      title: 'Plans',
      description: 'an array of load-balancing plans',
      minItems: 1,

      items: {
        type: 'object',
        title: 'Plan',
        required: ['name', 'mode', 'pools'],

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
            title: 'Pools',
            description: 'list of pools where to apply the policy',
            items: { type: 'string', $type: 'Pool' },
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
                title: 'RAM, free memory (MB)',
                default: DEFAULT_CRITICAL_THRESHOLD_MEMORY_FREE,
              },
            },
          },

          excludedHosts: {
            type: 'array',
            title: 'Excluded hosts',
            description: 'list of hosts not affected by the plan',
            items: { type: 'string', $type: 'Host' },
          },

          affinityTags: {
            type: 'array',
            title: 'Affinity tags',
            description: 'VMs sharing a tag are placed on the same host',
            items: { type: 'string', $type: 'Tag' },
          },

          antiAffinityTags: {
            type: 'array',
            title: 'Anti-affinity tags',
            description: 'VMs sharing a tag are spread across different hosts',
            items: { type: 'string', $type: 'Tag' },
          },

          // balanceVcpus is kept for schema compatibility with the previous plugin
          balanceVcpus: {
            enum: [false, 'preventive', true],
            title: 'Performance plan behaviour',
            description: 'Optional features for performance plan',
            default: false,
          },
        },
      },
    },

    ignoredVmTags: {
      type: 'array',
      title: 'Ignored VM tags',
      description: 'VMs with these tags are never migrated',
      items: { type: 'string', $type: 'Tag' },
    },

    advanced: {
      title: 'Advanced',
      type: 'object',
      default: {},
      properties: {
        maxConcurrentMigrations: {
          type: 'integer',
          title: 'Maximum concurrent migrations',
          description: 'Limit simultaneous migrations for faster individual migrations',
          default: 2,
          minimum: 1,
        },
        migrationCooldown: {
          type: 'integer',
          title: 'Migration cooldown (minutes)',
          description: 'Minimum time before a VM can be migrated again',
          default: 30,
          minimum: 0,
        },
      },
    },
  },
}

// ===================================================================
// Raw configuration shape (what xo-server passes to configure())
// ===================================================================

interface PlanConfig {
  name: string
  mode: string
  pools: string[]
  thresholds?: { cpu?: number; memoryFree?: number }
  excludedHosts?: string[]
  affinityTags?: string[]
  antiAffinityTags?: string[]
  balanceVcpus?: boolean | 'preventive'
}

interface PluginConfig {
  plans?: PlanConfig[]
  ignoredVmTags?: string[]
  advanced?: {
    maxConcurrentMigrations?: number
    migrationCooldown?: number
  }
}

// ===================================================================
// Plugin
// ===================================================================

class LoadBalancerPlugin {
  private readonly _xo: XoAppWithRestApi
  private _plans: Plan[] = []
  private _poolIds: string[] = []
  private _globalOptions!: GlobalOptions
  private _semaphore!: Semaphore

  private readonly _migrationHistory: GlobalOptions['migrationHistory'] = new Map()
  private readonly _job: ReturnType<ReturnType<typeof createSchedule>['createJob']>
  private _unregisterRestApi: (() => void) | undefined

  constructor(xo: XoAppWithRestApi) {
    this._xo = xo
    this._job = createSchedule(`*/${EXECUTION_DELAY} * * * *`).createJob(async () => {
      try {
        await this._executePlans()
      } catch (error) {
        log.warn('Scheduled load-balancing run failed', { error })
      }
    })
  }

  configure({ plans = [], ignoredVmTags = [], advanced = {} }: PluginConfig): void {
    this._plans = []
    this._poolIds = []

    this._globalOptions = {
      ignoredVmTags: new Set(ignoredVmTags),
      migrationCooldown: (advanced.migrationCooldown ?? 30) * 60 * 1000,
      migrationHistory: this._migrationHistory,
    }

    this._semaphore = new Semaphore(advanced.maxConcurrentMigrations ?? 2)

    for (const planConfig of plans) {
      const modeValue = MODES[planConfig.mode]
      if (modeValue === undefined) {
        log.warn('Unknown plan mode, skipping', { mode: planConfig.mode, plan: planConfig.name })
        continue
      }
      this._addPlan(modeValue, planConfig)
    }
  }

  load(): void {
    this._unregisterRestApi = this._xo.registerRestApi(
      {
        actions: {
          'dry-run': {
            _post: (req: IncomingMessage) => this._handleDryRunRequest(req),
          },
        },
      },
      '/plugins/load-balancer'
    )

    this._job.start()
    log.info('Load balancer plugin loaded', { plans: this._plans.map(p => p._name) })
  }

  unload(): void {
    this._job.stop()
    this._unregisterRestApi?.()
    this._unregisterRestApi = undefined
    log.info('Load balancer plugin unloaded')
  }

  // ===================================================================
  // Dry-run: execute plans in recording mode and return proposed migrations
  // ===================================================================

  private async _handleDryRunRequest(req: IncomingMessage): Promise<{ proposedMigrations: ProposedMigration[] }> {
    // Body was already parsed as JSON by the framework's json() middleware
    const body = (req as IncomingMessage & { body?: { planName?: string } }).body
    return this._dryRun(body?.planName)
  }

  private async _dryRun(planName?: string): Promise<{ proposedMigrations: ProposedMigration[] }> {
    const plansToRun = planName !== undefined ? this._plans.filter(p => p._name === planName) : this._plans

    if (plansToRun.length === 0) {
      throw new Error(`No plan found${planName !== undefined ? ` with name "${planName}"` : ''}`)
    }

    // Re-build plans with dryRun enabled
    const dryRunGlobalOptions: GlobalOptions = { ...this._globalOptions, dryRun: true }

    const dryRunPlans = plansToRun.map(plan => this._clonePlanAsDryRun(plan, dryRunGlobalOptions))

    await Promise.all(dryRunPlans.map(p => p.execute()))

    const proposedMigrations = dryRunPlans.flatMap(p => p._proposedMigrations)

    log.info('Dry-run complete', { proposedMigrationsCount: proposedMigrations.length })

    return { proposedMigrations }
  }

  private _clonePlanAsDryRun(plan: Plan, dryRunGlobalOptions: GlobalOptions): Plan {
    // Build a new plan of the same type with dryRun options
    const poolIds = [...plan._poolIds]
    const options: PlanOptions = {
      excludedHosts: [...plan._excludedHosts],
      affinityTags: [...plan._affinityTags],
      antiAffinityTags: [...plan._antiAffinityTags],
      balanceVcpus:
        plan._performanceSubmode === 'conservative'
          ? false
          : plan._performanceSubmode === 'preventive'
            ? 'preventive'
            : true,
    }

    if (plan instanceof PerformancePlan) {
      return new PerformancePlan(this._xo, plan._name, poolIds, options, dryRunGlobalOptions, this._semaphore)
    } else if (plan instanceof DensityPlan) {
      return new DensityPlan(this._xo, plan._name, poolIds, options, dryRunGlobalOptions, this._semaphore)
    } else {
      return new SimplePlan(this._xo, plan._name, poolIds, options, dryRunGlobalOptions, this._semaphore)
    }
  }

  // ===================================================================
  // Internal helpers
  // ===================================================================

  private _addPlan(mode: number, { name, pools, ...rawOptions }: PlanConfig): void {
    const uniquePools = [...new Set(pools)]

    // Each pool can only belong to one plan
    const conflicting = uniquePools.filter(id => this._poolIds.includes(id))
    if (conflicting.length > 0) {
      throw new Error(`Pool(s) already included in another plan: ${conflicting.join(', ')}`)
    }

    this._poolIds.push(...uniquePools)

    // Raw config uses plain strings for IDs; cast to branded types expected by PlanOptions
    const options: PlanOptions = {
      ...rawOptions,
      excludedHosts: rawOptions.excludedHosts as XoHost['id'][] | undefined,
    }

    let plan: Plan
    if (mode === PERFORMANCE_MODE) {
      plan = new PerformancePlan(this._xo, name, uniquePools, options, this._globalOptions, this._semaphore)
    } else if (mode === DENSITY_MODE) {
      plan = new DensityPlan(this._xo, name, uniquePools, options, this._globalOptions, this._semaphore)
    } else {
      plan = new SimplePlan(this._xo, name, uniquePools, options, this._globalOptions, this._semaphore)
    }

    this._plans.push(plan)
    log.debug('Plan registered', { name, mode, pools: uniquePools })
  }

  private async _executePlans(): Promise<void> {
    log.debug('Executing load-balancing plans', { count: this._plans.length })
    await Promise.all(this._plans.map(plan => plan.execute()))
  }
}

// ===================================================================
// XO-Server plugin entry point
// ===================================================================

export default ({ xo }: { xo: XoApp }): LoadBalancerPlugin => new LoadBalancerPlugin(xo as XoAppWithRestApi)
