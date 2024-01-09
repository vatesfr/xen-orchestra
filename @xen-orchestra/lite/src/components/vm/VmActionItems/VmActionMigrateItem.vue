<template>
  <MenuItem
    v-tooltip="
      selectedRefs.length > 0 &&
      !isMigratable &&
      $t(isSingleAction ? 'this-vm-cant-be-migrated' : 'no-selected-vm-can-be-migrated')
    "
    :busy="isMigrating"
    :disabled="isParentDisabled || !isMigratable"
    :icon="faRoute"
    @click="openModal()"
  >
    {{ $t('migrate') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import MenuItem from '@/components/menu/MenuItem.vue'
import { useContext } from '@/composables/context.composable'
import { useModal } from '@/composables/modal.composable'
import { DisabledContext } from '@/context'
import { vTooltip } from '@/directives/tooltip.directive'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import { faRoute } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  selectedRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { getByOpaqueRefs, isOperationPending, areSomeOperationAllowed } = useVmCollection()

const isParentDisabled = useContext(DisabledContext)

const isMigratable = computed(() =>
  getByOpaqueRefs(props.selectedRefs).some(vm =>
    areSomeOperationAllowed(vm, [VM_OPERATION.POOL_MIGRATE, VM_OPERATION.MIGRATE_SEND])
  )
)

const isMigrating = computed(() =>
  getByOpaqueRefs(props.selectedRefs).some(vm =>
    isOperationPending(vm, [VM_OPERATION.POOL_MIGRATE, VM_OPERATION.MIGRATE_SEND])
  )
)

const openModal = () =>
  useModal(() => import('@/components/modals/VmMigrateModal.vue'), {
    vmRefs: props.selectedRefs,
  })
</script>
