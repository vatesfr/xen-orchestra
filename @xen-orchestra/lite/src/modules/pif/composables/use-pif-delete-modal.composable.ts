import { usePifDeleteJob } from '@/jobs/pif-delete.job.ts'
import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function usePifDeleteModal(rawPifs: MaybeRefOrGetter<XenApiPif[]>) {
  const pifs = toComputed(rawPifs)

  const { t } = useI18n()

  const selectedPifId = useRouteQuery('id')

  const { run, canRun, isRunning, errorMessage } = usePifDeleteJob(pifs)

  const { open: openDeleteModal } = useDeleteModal()

  function openModal() {
    const n = pifs.value.length

    return openDeleteModal({
      props: {
        subject: t('n-pifs', { n }),
        description: t('pif-delete-info', { n }),
        confirmLabel: t('action:delete-n-pifs', { n }),
      },
      events: {
        onConfirm: async () => {
          try {
            await run()

            if (pifs.value.some(pif => pif.uuid === selectedPifId.value)) {
              selectedPifId.value = ''
            }
          } catch (error) {
            console.error('Error when deleting PIF:', error)
          }
        },
      },
    })
  }

  return { openModal, canRun, isRunning, errorMessage }
}
