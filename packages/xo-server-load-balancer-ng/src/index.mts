import type { XoApp, XoHost, XoPool, XoVm } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { asyncEach } from '@vates/async-each'

import type { MigrationPlan } from './constraint.mjs'
import { computeSimplePlan } from './plans/simple.mjs'

const log = createLogger('xo:load-balancer-ng')

// ─── XO interface ─────────────────────────────────────────────────────────────

/**
 * `registerRestApi` is added by xo-server's rest-api mixin at runtime but is
 * not yet declared in XoApp. Extend locally until it lands in @vates/types.
 */
type Xo = XoApp & {
  registerRestApi(spec: object, base: string): () => void
}

// ─── Plan execution ───────────────────────────────────────────────────────────

/**
 * Executes a migration plan returned by the solver.
 *
 * Migrations run concurrently (bounded to 5 at a time).
 * Individual failures are logged and do not abort the remaining migrations.
 */
async function executePlan(plan: MigrationPlan, xo: Xo): Promise<void> {
  await asyncEach(
    plan,
    async ([vmId, destHostId]) => {
      // getObject throws if the object vanished between planning and execution.
      // Catch it and log rather than aborting the whole plan.
      let vm: XoVm, destHost: XoHost
      try {
        vm = xo.getObject<XoVm>(vmId as XoVm['id'])
        destHost = xo.getObject<XoHost>(destHostId as XoHost['id'])
      } catch {
        log.warn('migration skipped: VM or host no longer exists', { vmId, destHostId })
        return
      }

      try {
        const srcXapi = xo.getXapi(vm)
        const destXapi = xo.getXapi(destHost)
        await srcXapi.migrateVm(vm.id, destXapi, destHost.id)
        log.info('VM migrated', { vmId, destHostId })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        log.warn('migration failed', { vmId, destHostId, error: error.message })
      }
    },
    { concurrency: 5 }
  )
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

class LoadBalancerNgPlugin {
  readonly #xo: Xo
  #unregisterRestApi: (() => void) | undefined

  constructor({ xo }: { xo: Xo }) {
    this.#xo = xo
  }

  load(): void {
    const xo = this.#xo

    this.#unregisterRestApi = xo.registerRestApi(
      {
        pools: {
          ':id': {
            _post: async (req: { params: { id: string }; body: unknown }) => {
              const poolId = req.params.id as XoPool['id']
              const body = req.body as Record<string, unknown>
              const dryRun = body.dryRun !== false // default true

              const pool = xo.getObjectsByType<XoPool>('pool')?.[poolId]
              if (pool === undefined) {
                throw Object.assign(new Error(`Pool not found: ${poolId}`), { statusCode: 404 })
              }

              const allHosts = xo.getObjectsByType<XoHost>('host') ?? {}
              const allVms = xo.getObjectsByType<XoVm>('VM') ?? {}

              const hosts = Object.values(allHosts).filter(h => h.$pool === poolId && h.power_state === 'Running')
              const hostIds = new Set(hosts.map(h => h.id))
              const vms = Object.values(allVms).filter(
                vm => vm.power_state === 'Running' && hostIds.has(vm.$container as XoHost['id'])
              )

              log.info('computing simple plan', {
                poolId,
                hostCount: hosts.length,
                vmCount: vms.length,
                dryRun,
              })

              const plan = computeSimplePlan(hosts, vms)

              if (!dryRun && plan.size > 0) {
                await executePlan(plan, xo)
              }

              return Object.fromEntries(plan)
            },
          },
        },
      },
      '/plugins/load-balancer'
    )
  }

  unload(): void {
    this.#unregisterRestApi?.()
    this.#unregisterRestApi = undefined
  }
}

export default ({ xo }: { xo: Xo }) => new LoadBalancerNgPlugin({ xo })
