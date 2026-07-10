import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPifManagementReconfigureJob } from '@/modules/pif/jobs/xo-pif-management-reconfigure.job.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function usePifManagementReconfigureModal(
  rawPif: MaybeRefOrGetter<FrontXoPif | undefined>,
  rawHost: MaybeRefOrGetter<FrontXoHost | undefined>
) {
  const pif = toComputed(rawPif)
  const host = toComputed(rawHost)

  const { run, canRun, isRunning, errorMessage } = useXoPifManagementReconfigureJob(pif, host)

  const openModal = useModal({
    component: import('@/modules/pif/components/modal/PifManagementReconfigureModal.vue'),
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
