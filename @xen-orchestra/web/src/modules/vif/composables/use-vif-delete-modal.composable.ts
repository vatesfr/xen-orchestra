import { useXoVifDeleteJob } from '@/modules/vif/jobs/xo-vif-delete.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useRedirectAfterDelete } from '@/shared/composables/redirect-after-delete.composable.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

export function useVifDeleteModal(rawVifs: MaybeRefOrGetter<FrontXoVif[]>) {
  const vifs = toComputed(rawVifs)

  const { t } = useI18n()

  const { run, canRun, isRunning } = useXoVifDeleteJob(vifs)

  const route = useRoute()

  const { redirectIfOnObjectPage } = useRedirectAfterDelete({
    // TODO: handle check when deleting from VIF page
    isOnObjectPage: () => route.name?.includes('/vm/') ?? false,
    redirectTo: () => {
      if (vifs.value[0]?.$VM !== undefined) {
        return { name: '/vm/[id]/networks', params: { id: vifs.value[0]?.$VM } }
      }
      return undefined
    },
  })

  const { open } = useDeleteModal()

  function openModal() {
    const count = vifs.value.length

    return open({
      events: {
        onConfirm: async () => {
          let result
          try {
            result = await run()
          } catch (error) {
            console.error('Error when deleting VIF:', error)
          }
          await redirectIfOnObjectPage(result)
        },
      },
      props: {
        subject: t('n-vifs', { n: count }),
        confirmLabel: t('action:delete-n-vifs', { n: count }),
      },
    })
  }

  return { openModal, canRun, isRunning }
}
