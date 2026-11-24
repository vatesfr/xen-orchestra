import { type DuplicateVmPayload, useXoVmDuplicateJob } from '@/modules/vm/jobs/xo-vm-duplicate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVmDuplicate(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const payload = ref<DuplicateVmPayload>()

  const { run, canRun: canDuplicateVm, isRunning: isDuplicatingVm } = useXoVmDuplicateJob(() => vm.value, payload)

  const { open } = useOverlay({
    component: () => import('@/modules/vm/components/drawer/VmDuplicateDrawer.vue'),
    events: {
      onConfirm: (duplicatePayload: DuplicateVmPayload) => {
        payload.value = duplicatePayload

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    vm: vm.value,
  }))

  function duplicateVm() {
    return open({ props })
  }

  return {
    duplicateVm,
    canDuplicateVm,
    isDuplicatingVm,
  }
}
