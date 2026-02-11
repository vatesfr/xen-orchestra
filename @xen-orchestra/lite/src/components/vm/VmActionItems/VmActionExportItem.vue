<template>
  <MenuItem
    v-tooltip="
      vmRefs.length > 0 && !isSomeExportable && t(isSingleAction ? 'vm-is-running' : 'no-selected-vm-can-be-exported')
    "
    :disabled="isDisabled"
    icon="object:vm"
    @click="openExportModal"
  >
    {{ t('action:export-vm', isSingleAction ? 1 : 2) }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { areSomeVmOperationAllowed } from '@/libs/vm'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmRefs } = defineProps<{
  vmRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRefs } = useVmStore().subscribe()

const isSomeExportable = computed(() =>
  getByOpaqueRefs(vmRefs).some(vm => areSomeVmOperationAllowed(vm, VM_OPERATION.EXPORT))
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
