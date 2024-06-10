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
import { useContext } from '@/composables/context.composable'
import { useModal } from '@/composables/modal.composable'
import { DisabledContext } from '@/context'
import { areSomeVmOperationAllowed, isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faRoute } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  selectedRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { getByOpaqueRefs } = useVmStore().subscribe()

const isParentDisabled = useContext(DisabledContext)

const isMigratable = computed(() =>
  getByOpaqueRefs(props.selectedRefs).some(vm =>
    areSomeVmOperationAllowed(vm, [VM_OPERATION.POOL_MIGRATE, VM_OPERATION.MIGRATE_SEND])
  )
)

const isMigrating = computed(() =>
  getByOpaqueRefs(props.selectedRefs).some(vm =>
    isVmOperationPending(vm, [VM_OPERATION.POOL_MIGRATE, VM_OPERATION.MIGRATE_SEND])
  )
)

const openModal = () =>
  useModal(() => import('@/components/modals/VmMigrateModal.vue'), {
    vmRefs: props.selectedRefs,
  })
</script>
