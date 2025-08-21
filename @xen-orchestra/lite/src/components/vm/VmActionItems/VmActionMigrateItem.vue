<template>
  <MenuItem
    v-tooltip="
      selectedRefs.length > 0 &&
      !isMigratable &&
      t(isSingleAction ? 'this-vm-cant-be-migrated' : 'no-selected-vm-can-be-migrated')
    "
    :busy="isMigrating"
    :disabled="isDisabled"
    :icon="faRoute"
    @click="openModal()"
  >
    {{ t('migrate') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useModal } from '@/composables/modal.composable'
import { areSomeVmOperationAllowed, isVmOperationPending } from '@/libs/vm'
import { useVmStore } from '@/stores/xen-api/vm.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faRoute } from '@fortawesome/free-solid-svg-icons'
import { VM_OPERATIONS, type XenApiVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  selectedRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRefs } = useVmStore().subscribe()

const isMigratable = computed(() =>
  getByOpaqueRefs(props.selectedRefs).some(vm =>
    areSomeVmOperationAllowed(vm, [VM_OPERATIONS.POOL_MIGRATE, VM_OPERATIONS.MIGRATE_SEND])
  )
)

const isMigrating = computed(() =>
  getByOpaqueRefs(props.selectedRefs).some(vm =>
    isVmOperationPending(vm, [VM_OPERATIONS.POOL_MIGRATE, VM_OPERATIONS.MIGRATE_SEND])
  )
)

const isDisabled = useDisabled(() => !isMigratable.value)

const openModal = () =>
  useModal(() => import('@/components/modals/VmMigrateModal.vue'), {
    vmRefs: props.selectedRefs,
  })
</script>
