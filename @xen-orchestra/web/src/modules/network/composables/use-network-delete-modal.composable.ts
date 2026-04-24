import { type NetworkDeleteModalProps } from '@/modules/network/components/modal/NetworkDeleteModal.vue'
import { NETWORK_DELETE_ERROR, useXoNetworkDeleteJob } from '@/modules/network/jobs/xo-network-delete.job.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getNetworkType } from '@/modules/network/utils/xo-network.util.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from '@vueuse/shared'
import { computed } from 'vue'

export function useNetworkDeleteModal(rawNetworks: MaybeRefOrGetter<FrontXoNetwork[]>) {
  const networks = toComputed(rawNetworks)

  const { run, canRun, isRunning, errorMessage, error } = useXoNetworkDeleteJob(networks)

  const networkType = computed<NetworkDeleteModalProps['type']>(() => getNetworkType(networks.value[0]))

  const openNetworkDeleteModal = useModal({
    component: import('@/modules/network/components/modal/NetworkDeleteModal.vue'),
    props: { count: computed(() => networks.value.length), type: networkType },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when deleting network:', error)
      }
    },
  })

  const openNetworkDeleteErrorModal = useModal({
    component: import('@/modules/network/components/modal/NetworkDeleteErrorModal.vue'),
    props: {
      error: errorMessage,
      showConnectedVifsMessage: computed(() => error.value?.jobName === NETWORK_DELETE_ERROR.VIFS_IN_USE),
    },
  })

  function openModal() {
    if (!canRun.value) {
      openNetworkDeleteErrorModal()
    } else {
      openNetworkDeleteModal()
    }
  }

  return { openModal, canRun, isRunning }
}
