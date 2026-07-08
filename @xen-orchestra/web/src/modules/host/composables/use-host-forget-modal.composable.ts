import { useXoHostForgetJob } from '@/modules/host/jobs/xo-host-forget.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter } from 'vue'

export function useHostForgetModal(rawHost: MaybeRefOrGetter<FrontXoHost>) {
  const host = toComputed(rawHost)

  const { run, canRun, isRunning, errorMessage } = useXoHostForgetJob(host)

  const openModal = useModal(() => ({
    component: import('@/modules/host/components/modal/HostForgetModal.vue'),
    props: { host: host.value },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when forgetting Host:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
