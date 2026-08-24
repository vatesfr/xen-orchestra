import { useXoPifManagementReconfigureJob } from '@/modules/pif/jobs/xo-pif-management-reconfigure.job.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function usePifManagementReconfigureModal(rawPif: MaybeRefOrGetter<FrontXoPif | undefined>) {
  const pif = toComputed(rawPif)

  const { run, canRun, isRunning, errorMessage } = useXoPifManagementReconfigureJob(pif)

  const openModal = useModal({
    component: import('@/modules/pif/components/modal/PifManagementReconfigureModal.vue'),
    props: { device: computed(() => pif.value?.device ?? '') },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when reconfiguring PIF management interface:', error)
      }
    },
  })

  return { openModal, canRun, isRunning, errorMessage }
}
