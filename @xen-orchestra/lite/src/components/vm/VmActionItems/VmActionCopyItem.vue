<template>
  <VtsMenuItem :icon="faCopy" v-bind="menuItem">
    {{ $t('copy') }}
  </VtsMenuItem>
</template>

<script lang="ts" setup>
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import VtsMenuItem from '@core/components/menu/VtsMenuItem.vue'
import { type MenuLike, useMenuAction } from '@core/packages/menu'
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  menu: MenuLike
  selectedRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRef } = useVmStore().subscribe()

const selectedVms = computed(() =>
  props.selectedRefs.map(vmRef => getByOpaqueRef(vmRef)).filter((vm): vm is XenApiVm => vm !== undefined)
)

const areAllSelectedVmsHalted = computed(
  () =>
    selectedVms.value.length > 0 &&
    selectedVms.value.every(selectedVm => selectedVm.power_state === VM_POWER_STATE.HALTED)
)

const areSomeSelectedVmsCloning = computed(() =>
  selectedVms.value.some(vm => isVmOperationPending(vm, VM_OPERATION.CLONE))
)

const isDisabled = computed(() => {
  return selectedVms.value.length === 0 || !areAllSelectedVmsHalted.value
})

const menuItem = useMenuAction({
  parent: props.menu,
  handler: async () => {
    const vmRefsToClone = Object.fromEntries(selectedVms.value.map(vm => [vm.$ref, `${vm.name_label} (COPY)`]))

    await useXenApiStore().getXapi().vm.clone(vmRefsToClone)
  },
  disabled: () => {
    if (!areAllSelectedVmsHalted.value) {
      return props.isSingleAction ? t('vm-is-running') : t('selected-vms-in-execution')
    }

    return isDisabled.value
  },
  busy: areSomeSelectedVmsCloning,
})
</script>
