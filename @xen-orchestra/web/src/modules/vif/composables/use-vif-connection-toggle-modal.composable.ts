import { useXoVifConnectJob } from '@/modules/vif/jobs/xo-vif-connect.job.ts'
import { useXoVifDisconnectJob } from '@/modules/vif/jobs/xo-vif-disconnect.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { CONNECTION_ACTION } from '@/shared/constants.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export type VifConnectionAction = (typeof CONNECTION_ACTION)[keyof typeof CONNECTION_ACTION]

export function useVifConnectionToggleModal(
  rawAction: MaybeRefOrGetter<VifConnectionAction>,
  rawVifs: MaybeRefOrGetter<FrontXoVif[]>,
  rawVm: MaybeRefOrGetter<FrontXoVm>
) {
  const action = toComputed(rawAction)
  const vifs = toComputed(rawVifs)
  const vm = toComputed(rawVm)

  const connectJob = useXoVifConnectJob(vifs, vm)
  const disconnectJob = useXoVifDisconnectJob(vifs, vm)

  const job = computed(() => (action.value === CONNECTION_ACTION.CONNECT ? connectJob : disconnectJob))

  const canRun = computed(() => job.value.canRun.value)
  const isRunning = computed(() => job.value.isRunning.value)
  const errorMessage = computed(() => job.value.errorMessage.value)

  const openModal = useModal(() => ({
    component: import('@/modules/vif/components/modal/VifConnectionToggleModal.vue'),
    props: { action: action.value, count: vifs.value.length },
    onConfirm: async () => {
      try {
        await job.value.run()
      } catch (error) {
        console.error(`Error when ${action.value}ing VIF:`, error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
