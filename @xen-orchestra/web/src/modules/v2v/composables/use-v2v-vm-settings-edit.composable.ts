import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import type { V2vVmMappingContext, V2vVmOverrides } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoV2vVm } from '@vates/types'
import { reactiveComputed } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'

// The drawer confirms the whole settings of the VM: they replace its stored overrides. As an overlay, it renders
// outside the wizard: it is handed the inventory of the connected source
export function useV2vVmSettingsEdit(
  rawVm: MaybeRefOrGetter<XoV2vVm>,
  { list: rawList, updateVm }: V2vVmMappingContext
) {
  const vm = toComputed(rawVm)

  const list = toComputed(rawList)

  const { inventory } = useV2vConnection()

  const { open } = useOverlay({
    component: () => import('@/modules/v2v/components/drawer/V2vVmSettingsDrawer.vue'),
    events: {
      onConfirm: (overrides: V2vVmOverrides) => {
        updateVm(vm.value.id, () => ({ id: vm.value.id, ...overrides }))
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    vm: vm.value,
    list: list.value,
    inventory: inventory.value,
  }))

  function editVmSettings() {
    return open({ props })
  }

  return { editVmSettings }
}
