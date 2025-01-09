<template>
  <VtsMenuItem :icon="faDisplay" v-bind="menuItem">
    {{ $t(isSingleAction ? 'export-vm' : 'export-vms') }}
  </VtsMenuItem>
</template>

<script lang="ts" setup>
import { useContext } from '@/composables/context.composable'
import { useModal } from '@/composables/modal.composable'
import { DisabledContext } from '@/context'
import { areSomeVmOperationAllowed } from '@/libs/vm'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsMenuItem from '@core/components/menu/VtsMenuItem.vue'
import { type MenuLike, useMenuAction } from '@core/packages/menu'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  menu: MenuLike
  vmRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRefs } = useVmStore().subscribe()

const isParentDisabled = useContext(DisabledContext)

const isSomeExportable = computed(() =>
  getByOpaqueRefs(props.vmRefs).some(vm => areSomeVmOperationAllowed(vm, VM_OPERATION.EXPORT))
)

const isDisabled = computed(() => isParentDisabled.value || !isSomeExportable.value)

const menuItem = useMenuAction({
  parent: props.menu,
  handler: () =>
    useModal(() => import('@/components/modals/VmExportModal.vue'), {
      vmRefs: props.vmRefs,
    }),
  disabled: () => {
    if (props.vmRefs.length > 0 && !isSomeExportable.value) {
      return props.isSingleAction ? t('vm-is-running') : t('no-selected-vm-can-be-exported')
    }

    return isDisabled.value
  },
})
</script>
