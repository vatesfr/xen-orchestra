import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { xoPoolArg } from '@/modules/pool/jobs/xo-pool-args.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { MigrationEntry } from '@/modules/pool/types/load-balancer.type.ts'
import { computeMockMigrationPlan, resolveLoadBalanceApiResponse } from '@/modules/pool/utils/load-balancer.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_POWER_STATE } from '@vates/types'
import { useI18n } from 'vue-i18n'

// Set to false when the backend endpoint is ready
const USE_MOCK = true

/**
 * API response type for `pool.loadBalance(plan, { dryRun: true })`
 */
type LoadBalanceApiResponse = Record<string, string>

export const useXoPoolLoadBalanceDryRunJob = defineJob('pool.load-balance-dry-run', [xoPoolArg], () => {
  const { t } = useI18n()
  const { vms: allVms } = useXoVmCollection()
  const { hosts: allHosts } = useXoHostCollection()

  return {
    async run(pool: FrontXoPool): Promise<MigrationEntry[]> {
      const poolVms = allVms.value.filter(vm => vm.$pool === pool.id && vm.power_state === VM_POWER_STATE.RUNNING)
      const poolHosts = allHosts.value.filter(host => host.$pool === pool.id)

      if (USE_MOCK) {
        // TODO: remove mock when backend is ready
        await new Promise(resolve => setTimeout(resolve, 500))

        return computeMockMigrationPlan(poolVms, poolHosts)
      }

      const apiResponse = await fetchPost<LoadBalanceApiResponse>(`pools/${pool.id}/actions/load_balancer`, {
        plan: 'simple',
        dryRun: true,
      })

      return resolveLoadBalanceApiResponse(apiResponse, poolVms, poolHosts)
    },

    validate(isRunning, pool?: FrontXoPool) {
      if (pool === undefined) {
        throw new JobError(t('load-balancer:dry-run-missing-pool'))
      }

      if (isRunning) {
        throw new JobRunningError(t('load-balancer:dry-run-in-progress'))
      }
    },
  }
})
