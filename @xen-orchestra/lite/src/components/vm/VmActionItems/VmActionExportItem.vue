<template>
  <MenuItem
    v-tooltip="
      vmRefs.length > 0 && !isSomeExportable && t(isSingleAction ? 'vm-is-running' : 'no-selected-vm-can-be-exported')
    "
    :disabled="isDisabled"
    icon="fa:display"
    @click="openExportModal"
  >
    {{ t(isSingleAction ? 'export-vm' : 'export-vms') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { areSomeVmOperationAllowed } from '@/libs/vm'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { VM_OPERATIONS, type XenApiVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmRefs } = defineProps<{
  vmRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRefs } = useVmStore().subscribe()

const isSomeExportable = computed(() =>
  getByOpaqueRefs(vmRefs).some(vm => areSomeVmOperationAllowed(vm, VM_OPERATIONS.EXPORT))
)

const isDisabled = useDisabled(() => !isSomeExportable.value)

const xenApi = useXenApiStore().getXapi()

const openModal = useModal()

const openExportModal = useModal({
  component: import('@/components/modals/VmExportModal.vue'),
  props: { count: computed(() => vmRefs.length) },
  onConfirm: compressionType => xenApi.vm.export(vmRefs, compressionType, openModal),
})
</script>
