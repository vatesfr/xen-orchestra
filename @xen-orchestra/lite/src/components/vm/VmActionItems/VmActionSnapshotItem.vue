<template>
  <MenuItem :busy="areSomeVmsSnapshoting" :disabled="isDisabled" :icon="faCamera" @click="handleSnapshot">
    {{ $t('snapshot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import MenuItem from '@/components/menu/MenuItem.vue'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import { faCamera } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const { getByOpaqueRef, isOperationPending } = useVmCollection()

const vms = computed(() =>
  props.vmRefs.map(vmRef => getByOpaqueRef(vmRef)).filter((vm): vm is XenApiVm => vm !== undefined)
)

const areSomeVmsSnapshoting = computed(() => vms.value.some(vm => isOperationPending(vm, VM_OPERATION.SNAPSHOT)))

const isDisabled = computed(() => vms.value.length === 0 || areSomeVmsSnapshoting.value)

const handleSnapshot = () => {
  const vmRefsToSnapshot = Object.fromEntries(
    vms.value.map(vm => [vm.$ref, `${vm.name_label}_${new Date().toISOString()}`])
  )
  return useXenApiStore().getXapi().vm.snapshot(vmRefsToSnapshot)
}
</script>

<style lang="postcss" scoped></style>
