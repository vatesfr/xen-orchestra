import { useXoNetworkManagementReconfigureJob } from '@/modules/network/jobs/xo-network-management-reconfigure.job.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useNetworkManagementReconfigureModal(
  rawNetwork: MaybeRefOrGetter<FrontXoNetwork | undefined>,
  rawPool: MaybeRefOrGetter<FrontXoPool | undefined>
) {
  const network = toComputed(rawNetwork)
  const pool = toComputed(rawPool)

  const { run, canRun, isRunning, errorMessage } = useXoNetworkManagementReconfigureJob(network, pool)

  const openModal = useModal({
    component: import('@/modules/network/components/modal/NetworkManagementReconfigureModal.vue'),
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when reconfiguring pool management interface:', error)
      }
    },
  })

  return { openModal, canRun, isRunning, errorMessage }
}
