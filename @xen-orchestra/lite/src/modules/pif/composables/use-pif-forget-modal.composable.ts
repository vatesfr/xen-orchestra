import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { usePifForgetJob } from '@/modules/pif/jobs/pif-forget.job.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function usePifForgetModal(rawPifs: MaybeRefOrGetter<XenApiPif[]>) {
  const pifs = toComputed(rawPifs)

  const { t } = useI18n()

  const selectedPifId = useRouteQuery('id')

  const { run, canRun, isRunning, errorMessage } = usePifForgetJob(pifs)

  const { open: openForgetModal } = useOverlay({
    component: () => import('@/components/modals/ForgetModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  function openModal() {
    const count = pifs.value.length

    return openForgetModal({
      props: {
        subject: t('n-pifs', { n: count }),
        description: t('pif-forget-info', { n: count }),
        confirmLabel: t('action:forget-n-pifs', { n: count }),
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
