<template>
  <MenuItem
    v-tooltip="
      vmRefs.length > 0 && !isSomeExportable && $t(isSingleAction ? 'vm-is-running' : 'no-selected-vm-can-be-exported')
    "
    :icon="faDisplay"
    :disabled="isDisabled"
    @click="openModal"
  >
    {{ $t(isSingleAction ? 'export-vm' : 'export-vms') }}
  </MenuItem>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'

import MenuItem from '@/components/menu/MenuItem.vue'
import { DisabledContext } from '@/context'
import { useContext } from '@/composables/context.composable'
import { useModal } from '@/composables/modal.composable'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import { vTooltip } from '@/directives/tooltip.directive'

import type { XenApiVm } from '@/libs/xen-api/xen-api.types'

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
