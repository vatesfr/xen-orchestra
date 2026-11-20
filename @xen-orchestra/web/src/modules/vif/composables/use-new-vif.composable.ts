import { type NewVifPayload, useXoVifCreateJob } from '@/modules/vif/jobs/xo-vif-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useNewVif(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const payload = ref<NewVifPayload>()

  const { run, isRunning: isCreatingVif } = useXoVifCreateJob(payload)

  const { open } = useOverlay({
    component: () => import('@/modules/vif/components/drawer/NewVifDrawer.vue'),
    events: {
      onConfirm: (newPayload: NewVifPayload) => {
        payload.value = newPayload

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    vmId: vm.value.id,
    poolId: vm.value.$pool,
  }))

  function openNewVifDrawer() {
    return open({ props })
  }

  return {
    openNewVifDrawer,
    isCreatingVif,
  }
}
