import { useXoPifManagementReconfigureJob } from '@/modules/pif/jobs/xo-pif-management-reconfigure.job.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function usePifManagementReconfigureModal(rawPif: MaybeRefOrGetter<FrontXoPif | undefined>) {
  const pif = toComputed(rawPif)

  const { run, canRun, isRunning, errorMessage } = useXoPifManagementReconfigureJob(pif)

  const { open } = useOverlay({
    component: () => import('@/modules/pif/components/modal/PifManagementReconfigureModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  function openModal() {
    return open({
      props: {
        device: pif.value?.device ?? '',
      },
      events: {
        onConfirm: async () => {
          try {
            void run()
          } catch (error) {
            console.error('Error when reconfiguring PIF management interface:', error)
          }
        },
      },
    })
  }
  return { openModal, canRun, isRunning, errorMessage }
}
