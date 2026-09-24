import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkDeleteJob } from '@/modules/network/jobs/network-delete.job.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useNetworkDelete(rawNetworks: MaybeRefOrGetter<XenApiNetwork[]>) {
  const networks = toComputed(rawNetworks)

  const { t } = useI18n()

  const {
    run,
    canRun: canDeleteNetworks,
    isRunning: isDeletingNetworks,
    errorMessage: deleteNetworksErrorMessage,
  } = useNetworkDeleteJob(networks)

  const { open: openNetworkDeleteModal } = useDeleteModal()

  const { open: openNetworkDeleteErrorModal } = useOverlay({
    component: () => import('@core/components/modal/VtsErrorModal.vue'),
    events: {
      onClose: true,
    },
  })

  function deleteNetworks() {
    if (!canDeleteNetworks.value) {
      return openNetworkDeleteErrorModal({
        props: {
          title: t('unable-to-delete-network'),
          error: deleteNetworksErrorMessage.value,
        },
      })
    }

    const count = networks.value.length

    return openNetworkDeleteModal({
      props: {
        accent: 'danger',
        subject: t('n-internal-networks', { n: count }),
        confirmLabel: t('action:delete-n-networks', { n: count }),
      },
      events: {
        onConfirm: async () => {
          try {
            await run()
          } catch (error) {
            console.error('Error when deleting network:', error)
          }
        },
      },
    })
  }

  return { deleteNetworks, isDeletingNetworks }
}
