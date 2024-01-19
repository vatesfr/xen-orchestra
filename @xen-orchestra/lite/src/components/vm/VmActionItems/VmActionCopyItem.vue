<template>
  <MenuItem
    v-tooltip="!areAllSelectedVmsHalted && $t(isSingleAction ? 'vm-is-running' : 'selected-vms-in-execution')"
    :busy="areSomeSelectedVmsCloning"
    :disabled="isDisabled"
    :icon="faCopy"
    @click="handleCopy"
  >
    {{ $t('copy') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import MenuItem from '@/components/menu/MenuItem.vue'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import { vTooltip } from '@/directives/tooltip.directive'
import { VM_POWER_STATE, VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  selectedRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { getByOpaqueRef, isOperationPending } = useVmCollection()

const selectedVms = computed(() =>
  props.selectedRefs.map(vmRef => getByOpaqueRef(vmRef)).filter((vm): vm is XenApiVm => vm !== undefined)
)

const areAllSelectedVmsHalted = computed(
  () =>
    selectedVms.value.length > 0 &&
    selectedVms.value.every(selectedVm => selectedVm.power_state === VM_POWER_STATE.HALTED)
)

const areSomeSelectedVmsCloning = computed(() =>
  selectedVms.value.some(vm => isOperationPending(vm, VM_OPERATION.CLONE))
)

const isDisabled = computed(() => {
  return selectedVms.value.length === 0 || !areAllSelectedVmsHalted.value
})

const handleCopy = async () => {
  const xapiStore = useXenApiStore()

  const vmRefsToClone = Object.fromEntries(selectedVms.value.map(vm => [vm.$ref, `${vm.name_label} (COPY)`]))

  await xapiStore.getXapi().vm.clone(vmRefsToClone)
}
</script>

<style lang="postcss" scoped></style>
