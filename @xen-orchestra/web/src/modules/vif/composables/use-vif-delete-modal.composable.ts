import { useXoVifDeleteJob } from '@/modules/vif/jobs/xo-vif-delete.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useRouter } from 'vue-router'

export function useVifDeleteModal(rawVifs: MaybeRefOrGetter<FrontXoVif[]>) {
  const vifs = toComputed(rawVifs)

  const { run, canRun, isRunning } = useXoVifDeleteJob(vifs)

  const router = useRouter()

  const openModal = useModal(() => ({
    component: import('@/modules/vif/components/modal/VifDeleteModal.vue'),
    props: { count: vifs.value.length },
    onConfirm: async () => {
      const vif = vifs.value[0]
      let result
      try {
        result = await run()
      } catch (error) {
        console.error('Error when deleting VIF:', error)
      }
      if (result && result[0].status === 'fulfilled' && router.currentRoute.value.path.includes(`/vif/${vif.id}`)) {
        await router.push({ name: '/vm/[id]/networks', params: { id: vif.$VM } })
      }
    },
  }))

  return { openModal, canRun, isRunning }
}
