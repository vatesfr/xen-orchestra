import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'

export function useVmMigrate(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const { open } = useOverlay({
    component: () => import('@/modules/vm/components/drawer/VmMigrateDrawer.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    vm: vm.value,
  }))

  function migrateVm() {
    return open({ props })
  }

  return {
    migrateVm,
  }
}
