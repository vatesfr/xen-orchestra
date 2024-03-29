<template>
  <MenuItem
    v-tooltip="
      vmRefs.length > 0 && !isSomeExportable && $t(isSingleAction ? 'vm-is-running' : 'no-selected-vm-can-be-exported')
    "
    :disabled="isDisabled"
    :icon="faDisplay"
    @click="openModal"
  >
    {{ $t(isSingleAction ? 'export-vm' : 'export-vms') }}
  </MenuItem>
</template>
<script lang="ts" setup>
import { useContext } from '@/composables/context.composable'
import { useModal } from '@/composables/modal.composable'
import { DisabledContext } from '@/context'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { getByOpaqueRefs, areSomeOperationAllowed } = useVmCollection()

const isParentDisabled = useContext(DisabledContext)

const isSomeExportable = computed(() =>
  getByOpaqueRefs(props.vmRefs).some(vm => areSomeOperationAllowed(vm, VM_OPERATION.EXPORT))
)

const isDisabled = computed(() => isParentDisabled.value || !isSomeExportable.value)

const openModal = () => {
  useModal(() => import('@/components/modals/VmExportModal.vue'), {
    vmRefs: props.vmRefs,
  })
}
</script>
