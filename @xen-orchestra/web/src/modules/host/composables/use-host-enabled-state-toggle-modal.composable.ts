import { useXoHostDisableJob } from '@/modules/host/jobs/xo-host-disable.job.ts'
import { useXoHostEnableJob } from '@/modules/host/jobs/xo-host-enable.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { ENABLED_STATE_ACTION, type EnabledStateAction } from '@/modules/host/types/enabled-state.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useHostEnabledStateToggleModal(
  rawAction: MaybeRefOrGetter<EnabledStateAction>,
  rawHost: MaybeRefOrGetter<FrontXoHost>
) {
  const action = toComputed(rawAction)
  const host = toComputed(rawHost)

  const enableJob = useXoHostEnableJob(host)
  const disableJob = useXoHostDisableJob(host)

  const job = computed(() => (action.value === ENABLED_STATE_ACTION.ENABLE ? enableJob : disableJob))

  const canRun = computed(() => job.value.canRun.value)
  const isRunning = computed(() => job.value.isRunning.value)
  const errorMessage = computed(() => job.value.errorMessage.value)

  const openModal = useModal(() => ({
    component: import('@/modules/host/components/modal/HostEnabledStateToggleModal.vue'),
    props: { action: action.value, host: host.value },
    onConfirm: async () => {
      try {
        await job.value.run()
      } catch (error) {
        console.error(`Error when ${action.value} Host:`, error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
