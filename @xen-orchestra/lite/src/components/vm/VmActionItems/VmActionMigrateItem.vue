<template>
  <VtsMenuItem :icon="faRoute" v-bind="menuItem">
    {{ $t('migrate') }}
  </VtsMenuItem>
</template>

<script lang="ts" setup>
import { useModal } from '@/composables/modal.composable'
import { areSomeVmOperationAllowed, isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsMenuItem from '@core/components/menu/VtsMenuItem.vue'
import { type MenuLike, useMenuAction } from '@core/packages/menu'
import { faRoute } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  menu: MenuLike
  selectedRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRefs } = useVmStore().subscribe()

const vms = computed(() => getByOpaqueRefs(props.selectedRefs))

const menuItem = useMenuAction({
  parent: props.menu,
  handler: () =>
    useModal(() => import('@/components/modals/VmMigrateModal.vue'), {
      vmRefs: props.selectedRefs,
    }),
  disabled: () => {
    if (props.selectedRefs.length === 0) {
      return true
    }

    if (!vms.value.some(vm => areSomeVmOperationAllowed(vm, [VM_OPERATION.POOL_MIGRATE, VM_OPERATION.MIGRATE_SEND]))) {
      return props.isSingleAction ? t('this-vm-cant-be-migrated') : t('no-selected-vm-can-be-migrated')
    }
  },
  busy: computed(() =>
    vms.value.some(vm => isVmOperationPending(vm, [VM_OPERATION.POOL_MIGRATE, VM_OPERATION.MIGRATE_SEND]))
  ),
})
</script>
