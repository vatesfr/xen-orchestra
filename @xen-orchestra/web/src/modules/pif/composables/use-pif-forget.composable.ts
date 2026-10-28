import { useXoPifForgetJob } from '@/modules/pif/jobs/xo-pif-forget.job.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useForgetModal } from '@core/composables/modals/use-forget-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function usePifForget(rawPifs: MaybeRefOrGetter<FrontXoPif[]>) {
  const pifs = toComputed(rawPifs)

  const { t } = useI18n()

  const selectedPifId = useRouteQuery('id')

  const {
    run,
    canRun: canForgetPifs,
    isRunning: isForgettingPifs,
    errorMessage: forgetPifsErrorMessage,
  } = useXoPifForgetJob(pifs)

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
        onConfirm: () =>
          run({
            detached: true,
            onSuccess: results => {
              const isSelectedPifForgotten = results.some(
                (result, index) => result.status === 'fulfilled' && pifs.value[index]?.id === selectedPifId.value
              )

              if (isSelectedPifForgotten) {
                selectedPifId.value = ''
              }
            },
          }),
      },
    })
  }

  return { forgetPifs, canForgetPifs, isForgettingPifs, forgetPifsErrorMessage }
}
