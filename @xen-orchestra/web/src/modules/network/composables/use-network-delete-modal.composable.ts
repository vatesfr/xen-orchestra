import { NETWORK_DELETE_ERROR, useXoNetworkDeleteJob } from '@/modules/network/jobs/xo-network-delete.job.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getNetworkType, type NetworkType } from '@/modules/network/utils/xo-network.util.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useNetworkDeleteModal(rawNetworks: MaybeRefOrGetter<FrontXoNetwork[]>) {
  const networks = toComputed(rawNetworks)

  const { t } = useI18n()

  const { run, canRun, isRunning, errorMessage, error } = useXoNetworkDeleteJob(networks)

  const subject = computed(() => {
    const count = networks.value.length

    const subjectsByType: Record<NetworkType, string> = {
      physical: t('n-networks', { n: count }),
      bonded: t('n-bonded-networks', { n: count }),
      internal: t('n-internal-networks', { n: count }),
    }

    return subjectsByType[getNetworkType(networks.value[0])]
  })

  const { open: openNetworkDeleteModal } = useDeleteModal()

  const { open: openNetworkDeleteErrorModal } = useOverlay({
    component: () => import('@/modules/network/components/modal/NetworkDeleteErrorModal.vue'),
    events: {
      onClose: true,
    },
  })

  function openModal() {
    if (!canRun.value) {
      return openNetworkDeleteErrorModal({
        props: {
          error: errorMessage.value,
          showConnectedVifsMessage: error.value?.jobName === NETWORK_DELETE_ERROR.VIFS_IN_USE,
        },
      })
    }

    return openNetworkDeleteModal({
      events: {
        onConfirm: async () => {
          try {
            await run()
          } catch (apiError) {
            console.error('Error when deleting network:', apiError)
          }
        },
      },
      props: {
        subject: subject.value,
        confirmLabel: t('action:delete-n-networks', { n: networks.value.length }),
      },
    })
  }

  return { openModal, canRun, isRunning }
}
