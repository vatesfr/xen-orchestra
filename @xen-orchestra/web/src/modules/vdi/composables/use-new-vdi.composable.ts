import { type NewVdiPayload, useXoVdiCreateJob } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useNewVdi(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const payload = ref<NewVdiPayload>()

  const { run, isRunning: isCreatingVdi } = useXoVdiCreateJob(payload)

  const { open } = useOverlay({
    component: () => import('@/modules/vdi/components/drawer/NewVdiDrawer.vue'),
    events: {
      onConfirm: (newPayload: NewVdiPayload) => {
        payload.value = newPayload

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    vm: vm.value,
  }))

  function openNewVdiDrawer() {
    return open({ props })
  }

  return {
    openNewVdiDrawer,
    isCreatingVdi,
  }
}
