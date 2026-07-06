import type { XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVifConnectJob } from '@/modules/vif/jobs/vif-connect.job.ts'
import { useVifDisconnectJob } from '@/modules/vif/jobs/vif-disconnect.job.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { CONNECTION_ACTION, type ConnectionAction } from '@core/types/connection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useVifConnectionToggleModal(
  rawAction: MaybeRefOrGetter<ConnectionAction>,
  rawVifs: MaybeRefOrGetter<XenApiVif[]>,
  rawVm: MaybeRefOrGetter<XenApiVm>
) {
  const action = toComputed(rawAction)
  const vifs = toComputed(rawVifs)
  const vm = toComputed(rawVm)

  const connectJob = useVifConnectJob(vifs, vm)
  const disconnectJob = useVifDisconnectJob(vifs, vm)

  const job = computed(() => (action.value === CONNECTION_ACTION.CONNECT ? connectJob : disconnectJob))

  const canRun = computed(() => job.value.canRun.value)
  const isRunning = computed(() => job.value.isRunning.value)
  const errorMessage = computed(() => job.value.errorMessage.value)

  const openModal = useModal(() => ({
    component: import('@core/components/vif-connection-toggle-modal/VtsVifConnectionToggleModal.vue'),
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
