import { useXoSrConnectJob } from '@/modules/storage-repository/jobs/xo-sr-connect.job.ts'
import { useXoSrDisconnectJob } from '@/modules/storage-repository/jobs/xo-sr-disconnect.job.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { CONNECTION_ACTION } from '@/shared/constants.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export type SrConnectionAction = (typeof CONNECTION_ACTION)[keyof typeof CONNECTION_ACTION]

export function useSrConnectionToggleModal(
  rawAction: MaybeRefOrGetter<SrConnectionAction>,
  rawSrs: MaybeRefOrGetter<FrontXoSr[]>
) {
  const action = toComputed(rawAction)
  const srs = toComputed(rawSrs)

  const connectJob = useXoSrConnectJob(srs)
  const disconnectJob = useXoSrDisconnectJob(srs)

  const job = computed(() => (action.value === CONNECTION_ACTION.CONNECT ? connectJob : disconnectJob))

  const canRun = computed(() => job.value.canRun.value)
  const isRunning = computed(() => job.value.isRunning.value)
  const errorMessage = computed(() => job.value.errorMessage.value)

  const openModal = useModal(() => ({
    component: import('@/modules/storage-repository/components/modal/SrConnectionToggleModal.vue'),
    props: { action: action.value, count: srs.value.length },
    onConfirm: async () => {
      try {
        await job.value.run()
      } catch (error) {
        console.error(`Error when ${action.value}ing SR:`, error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
