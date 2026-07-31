import { useSrDeleteJob } from '@/jobs/sr-delete.job.ts'
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useSrDelete(rawSrs: MaybeRefOrGetter<XenApiSr[]>) {
  const srs = toComputed(rawSrs)

  const { t } = useI18n()

  const selectedSrId = useRouteQuery('id')

  const { run, canRun, isRunning, errorMessage } = useSrDeleteJob(srs)

  const { open } = useDeleteModal()

  function deleteSrs() {
    const count = srs.value.length

    // TODO Add a type-to-confirm input if count > 1
    return open({
      props: {
        subject: t('n-srs', { n: count }),
        description: t('sr-delete-info', { n: count }),
        confirmLabel: t('action:delete-n-srs', { n: count }),
      },
      events: {
        onConfirm: async () => {
          try {
            await run()

            if (srs.value.some(sr => sr.uuid === selectedSrId.value)) {
              selectedSrId.value = ''
            }
          } catch (error) {
            console.error('Error when deleting SR:', error)
          }
        },
      },
    })
  }

  return { deleteSrs, canRun, isRunning, errorMessage }
}
