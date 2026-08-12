import { usePifForgetJob } from '@/jobs/pif-forget.job.ts'
import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { useForgetModal } from '@core/composables/modals/use-forget-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function usePifForgetModal(rawPifs: MaybeRefOrGetter<XenApiPif[]>) {
  const pifs = toComputed(rawPifs)

  const { t } = useI18n()

  const selectedPifId = useRouteQuery('id')

  const { run, canRun, isRunning, errorMessage } = usePifForgetJob(pifs)

  const { open: openForgetModal } = useForgetModal()

  function openModal() {
    const n = pifs.value.length

    return openForgetModal({
      props: {
        subject: t('n-pifs', { n }),
        description: t('pif-forget-info'),
        confirmLabel: t('action:forget-n-pifs', { n }),
      },
      events: {
        onConfirm: async () => {
          try {
            await run()

            if (pifs.value.some(pif => pif.uuid === selectedPifId.value)) {
              selectedPifId.value = ''
            }
          } catch (error) {
            console.error('Error when forgetting PIF:', error)
          }
        },
      },
    })
  }

  return { openModal, canRun, isRunning, errorMessage }
}
