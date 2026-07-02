import { useXoVifDeleteJob } from '@/modules/vif/jobs/xo-vif-delete.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useRedirectAfterDelete } from '@/shared/composables/redirect-after-delete.composable.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useRoute } from 'vue-router'

export function useVifDeleteModal(rawVifs: MaybeRefOrGetter<FrontXoVif[]>) {
  const vifs = toComputed(rawVifs)

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

  const openModal = useOverlay(() => ({
    component: import('@/modules/vif/components/modal/VifDeleteModal.vue'),
    props: { count: vifs.value.length },
    onConfirm: async () => {
      let result
      try {
        result = await run()
      } catch (error) {
        console.error('Error when deleting VIF:', error)
      }
      await redirectIfOnObjectPage(result)
    },
  }))

  return { openModal, canRun, isRunning }
}
