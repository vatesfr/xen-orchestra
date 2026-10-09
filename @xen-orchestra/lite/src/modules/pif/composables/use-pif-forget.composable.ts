import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { usePifForgetJob } from '@/modules/pif/jobs/pif-forget.job.ts'
import { useForgetModal } from '@core/composables/modals/use-forget-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function usePifForget(rawPifs: MaybeRefOrGetter<XenApiPif[]>) {
  const pifs = toComputed(rawPifs)

  const { t } = useI18n()

  const selectedPifId = useRouteQuery('id')

  const {
    run: runForget,
    canRun: canForgetPifs,
    isRunning: isForgettingPifs,
    errorMessage: forgetPifsErrorMessage,
  } = usePifForgetJob(pifs)

  const { open } = useForgetModal()

  function forgetPifs() {
    const count = pifs.value.length

    return open({
      props: {
        subject: t('n-pifs', { n: count }),
        description: t('pif-forget-info', { n: count }),
        confirmLabel: t('action:forget-n-pifs', { n: count }),
      },
      events: {
        onConfirm: async () => {
          try {
            await runForget()

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

  return { forgetPifs, canForgetPifs, isForgettingPifs, forgetPifsErrorMessage }
}
