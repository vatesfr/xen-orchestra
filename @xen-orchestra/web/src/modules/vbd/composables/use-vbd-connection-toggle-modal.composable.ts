import { useXoVbdConnectJob } from '@/modules/vbd/jobs/xo-vbd-connect.job.ts'
import { useXoVbdDisconnectJob } from '@/modules/vbd/jobs/xo-vbd-disconnect.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { CONNECTION_ACTION } from '@/shared/constants.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export type VbdConnectionAction = (typeof CONNECTION_ACTION)[keyof typeof CONNECTION_ACTION]

export function useVbdConnectionToggleModal(
  rawAction: MaybeRefOrGetter<VbdConnectionAction>,
  rawVbds: MaybeRefOrGetter<FrontXoVbd[]>,
  rawVm: MaybeRefOrGetter<FrontXoVm>
) {
  const action = toComputed(rawAction)
  const vbds = toComputed(rawVbds)
  const vm = toComputed(rawVm)

  const connectJob = useXoVbdConnectJob(vbds, vm)
  const disconnectJob = useXoVbdDisconnectJob(vbds, vm)

  const job = computed(() => (action.value === CONNECTION_ACTION.CONNECT ? connectJob : disconnectJob))

  const canRun = computed(() => job.value.canRun.value)
  const isRunning = computed(() => job.value.isRunning.value)
  const errorMessage = computed(() => job.value.errorMessage.value)

  const openModal = useModal(() => ({
    component: import('@/modules/vbd/components/modal/VbdConnectionToggleModal.vue'),
    props: { action: action.value, count: vbds.value.length },
    onConfirm: async () => {
      try {
        await job.value.run()
      } catch (error) {
        console.error(`Error when ${action.value}ing VBD:`, error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
