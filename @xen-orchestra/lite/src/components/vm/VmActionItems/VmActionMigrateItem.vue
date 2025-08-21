<template>
  <MenuItem
    v-tooltip="
      selectedRefs.length > 0 &&
      !isMigratable &&
      t(isSingleAction ? 'this-vm-cant-be-migrated' : 'no-selected-vm-can-be-migrated')
    "
    :busy="isMigrating"
    :disabled="isDisabled"
    icon="fa:route"
    @click="openMigrateModal()"
  >
    {{ t('migrate') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVmMigration } from '@/composables/vm-migration.composable.ts'
import { areSomeVmOperationAllowed, isVmOperationPending } from '@/libs/vm'
import { useVmStore } from '@/stores/xen-api/vm.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { ABORT_MODAL } from '@core/packages/modal/types.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { VM_OPERATIONS, type XenApiVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { selectedRefs } = defineProps<{
  selectedRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRefs } = useVmStore().subscribe()

const isMigratable = computed(() =>
  getByOpaqueRefs(selectedRefs).some(vm =>
    areSomeVmOperationAllowed(vm, [VM_OPERATIONS.POOL_MIGRATE, VM_OPERATIONS.MIGRATE_SEND])
  )
)

const isMigrating = computed(() =>
  getByOpaqueRefs(selectedRefs).some(vm =>
    isVmOperationPending(vm, [VM_OPERATIONS.POOL_MIGRATE, VM_OPERATIONS.MIGRATE_SEND])
  )
)

const isDisabled = useDisabled(() => !isMigratable.value)

const { selectedHost, availableHosts, isValid, migrate } = useVmMigration(() => selectedRefs)

const openMigrateModal = useModal({
  component: import('@/components/modals/VmMigrateModal.vue'),
  props: {
    count: computed(() => selectedRefs.length),
    availableHosts,
  },
  onConfirm: async host => {
    selectedHost.value = host

    if (!isValid.value) {
      return ABORT_MODAL
    }

    await migrate()
  },
})
</script>
