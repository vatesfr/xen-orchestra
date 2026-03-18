import type { XoHost, XoVm } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { computeLoadBalancePlan } from './placement.mjs'
import { executeMigrations } from './migration.mjs'
import type { LoadBalancePlan, MigrationPlan } from './types.mjs'

const { info } = createLogger('xo:tag-balancer')

interface XoApp {
  getObjects(): Record<string, { type: string; $pool?: string; [key: string]: unknown }>
  getObject(id: string): { _xapiRef: string }
  getXapi(objectOrId: unknown): {
    call(method: string, ...args: unknown[]): Promise<unknown>
    callAsync(method: string, ...args: unknown[]): Promise<unknown>
  }
  addApiMethods(methods: Record<string, Record<string, unknown>>): () => void
}

export const configurationSchema = {
  type: 'object' as const,
  properties: {},
  additionalProperties: false,
}

class TagBalancerPlugin {
  #xo: XoApp
  #unregisterApiMethods: (() => void) | undefined

  constructor(xo: XoApp) {
    this.#xo = xo
  }

  load() {
    const computePlan = Object.assign(this.#computePlan.bind(this), {
      description: 'Compute a load balancing plan for a pool',
      permission: 'admin',
      params: {
        pool: { type: 'string' },
        mode: { type: 'string', optional: true },
        dryRun: { type: 'boolean', optional: true },
      },
    })

    this.#unregisterApiMethods = this.#xo.addApiMethods({
      tagBalancer: {
        computePlan,
      },
    })
  }

  unload() {
    this.#unregisterApiMethods?.()
    this.#unregisterApiMethods = undefined
  }

  async #computePlan({
    pool: poolId,
    mode = 'simple',
    dryRun = true,
  }: {
    pool: string
    mode?: LoadBalancePlan['mode']
    dryRun?: boolean
  }): Promise<MigrationPlan> {
    const allObjects = this.#xo.getObjects()

    const hosts = Object.values(allObjects).filter((obj): obj is XoHost => obj.type === 'host' && obj.$pool === poolId)
    const vms = Object.values(allObjects).filter((obj): obj is XoVm => obj.type === 'VM' && obj.$pool === poolId)

    if (hosts.length === 0) {
      throw new Error(`No hosts found for pool ${poolId}`)
    }

    info('computing load balance plan', { poolId, mode, hostCount: hosts.length, vmCount: vms.length })

    const migrations = computeLoadBalancePlan(hosts, vms, { mode })

    if (dryRun) {
      return migrations
    }

    const xapi = this.#xo.getXapi(poolId)
    return executeMigrations(migrations, xapi, {
      resolveRef: (id: string) => this.#xo.getObject(id)._xapiRef,
    })
  }
}

function pluginFactory({ xo }: { xo: XoApp }): TagBalancerPlugin {
  return new TagBalancerPlugin(xo)
}

pluginFactory.configurationSchema = configurationSchema

export default pluginFactory

export { computeLoadBalancePlan } from './placement.mjs'
export { executeMigrations } from './migration.mjs'
export { parseLoadBalancerTags, parseAllVmTags } from './tag-parser.mjs'
export type { LoadBalanceParams, LoadBalancePlan, MigrationPlan, VmLoadBalancerTags, XapiClient } from './types.mjs'
