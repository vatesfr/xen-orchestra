import { type NewVbdPayload, useXoVbdCreateJob } from '@/modules/vbd/jobs/xo-vbd-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVdiAttach(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const payload = ref<NewVbdPayload>()

  const { run, isRunning: isAttachingVdi } = useXoVbdCreateJob(payload)

  const { open } = useOverlay({
    component: () => import('@/modules/vdi/components/drawer/VdiAttachDrawer.vue'),
    events: {
      onConfirm: (newPayload: NewVbdPayload) => {
        payload.value = newPayload

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    vm: vm.value,
  }))

  function openVdiAttachDrawer() {
    return open({ props })
  }

  return {
    openVdiAttachDrawer,
    isAttachingVdi,
  }
}
