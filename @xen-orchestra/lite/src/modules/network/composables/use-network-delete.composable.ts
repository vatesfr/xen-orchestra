import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkDeleteJob } from '@/modules/network/jobs/network-delete.job.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useNetworkDelete(rawNetworks: MaybeRefOrGetter<XenApiNetwork[]>) {
  const networks = toComputed(rawNetworks)

  const { t } = useI18n()

  const selectedNetworkId = useRouteQuery('id')

  const {
    run,
    canRun: canDeleteNetworks,
    isRunning: isDeletingNetworks,
    errorMessage: deleteNetworksErrorMessage,
  } = useNetworkDeleteJob(networks)

  const { open } = useDeleteModal()

  function deleteNetworks() {
    const count = networks.value.length

    return open({
      props: {
        subject: t('n-internal-networks', { n: count }),
        confirmLabel: t('action:delete-n-networks', { n: count }),
      },
      events: {
        onConfirm: async () => {
          try {
            await run()

            if (networks.value.some(network => network.uuid === selectedNetworkId.value)) {
              selectedNetworkId.value = ''
            }
          } catch (error) {
            console.error('Error when deleting network:', error)
          }
        },
      },
    })
  }

  return { deleteNetworks, canDeleteNetworks, isDeletingNetworks, deleteNetworksErrorMessage }
}
