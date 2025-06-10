<template>
  <MenuItem
    v-tooltip="
      vmRefs.length > 0 && !isSomeExportable && t(isSingleAction ? 'vm-is-running' : 'no-selected-vm-can-be-exported')
    "
    :disabled="isDisabled"
    :icon="faDisplay"
    @click="openModal"
  >
    {{ t(isSingleAction ? 'export-vm' : 'export-vms') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useModal } from '@/composables/modal.composable'
import { areSomeVmOperationAllowed } from '@/libs/vm'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRefs } = useVmStore().subscribe()

const isSomeExportable = computed(() =>
  getByOpaqueRefs(props.vmRefs).some(vm => areSomeVmOperationAllowed(vm, VM_OPERATION.EXPORT))
)

const isDisabled = useDisabled(() => !isSomeExportable.value)

const openModal = () => {
  useModal(() => import('@/components/modals/VmExportModal.vue'), {
    vmRefs: props.vmRefs,
  })
}
</script>
