<template>
  <VtsMenuItem :icon="faTrashCan" v-bind="menuItem">
    {{ $t('delete') }}
  </VtsMenuItem>
</template>

<script lang="ts" setup>
import { useModal } from '@/composables/modal.composable'
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsMenuItem from '@core/components/menu/VtsMenuItem.vue'
import { type MenuLike, useMenuAction } from '@core/packages/menu'
import { faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  menu: MenuLike
  vmRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const { getByOpaqueRefs: getVms } = useVmStore().subscribe()

const vms = computed(() => getVms(props.vmRefs))

const menuItem = useMenuAction({
  parent: props.menu,
  handler: () =>
    useModal(() => import('@/components/modals/VmDeleteModal.vue'), {
      vmRefs: props.vmRefs,
    }),
  disabled: computed(() => {
    if (vms.value.length === 0) {
      return true
    }

    if (vms.value.some(vm => vm.power_state !== VM_POWER_STATE.HALTED)) {
      return t('selected-vms-in-execution')
    }

    return false
  }),
})
</script>
