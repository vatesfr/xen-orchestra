import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { xoNetworkArg } from '@/modules/network/jobs/xo-network-args.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { xoPoolArg } from '@/modules/pool/jobs/xo-pool-args.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoNetworkManagementReconfigureJob = defineJob(
  'network.management-reconfigure',
  [xoNetworkArg, xoPoolArg],
  () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()
    const { getPifsByNetworkId } = useXoPifCollection()
    const { hostsByPool } = useXoHostCollection()

    return {
      async run(network: FrontXoNetwork | undefined, pool: FrontXoPool | undefined) {
        const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(
          `pools/${pool!.id}/actions/management_reconfigure`,
          { network: network!.id }
        )

        return monitorTask(taskId)
      },

      validate: (isRunning, network: FrontXoNetwork | undefined, pool: FrontXoPool | undefined) => {
        if (!network || !pool) {
          throw new JobError(t('job:arg:missing-payload'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:management-reconfigure:in-progress'))
        }

        const networkPifs = getPifsByNetworkId(network.id)

        if (networkPifs.some(pif => pif.management)) {
          throw new JobError(t('job:network-management-reconfigure:already-management'))
        }

        const hosts = hostsByPool.value.get(pool.id) ?? []
        const hostsWithoutIp = hosts.filter(
          host => !networkPifs.some(pif => pif.$host === host.id && (pif.ip || pif.ipv6.length > 0))
        )

        if (hostsWithoutIp.length > 0) {
          throw new JobError(t('job:network-management-reconfigure:missing-ip', { n: hostsWithoutIp.length }))
        }
      },
    }
  }
)
