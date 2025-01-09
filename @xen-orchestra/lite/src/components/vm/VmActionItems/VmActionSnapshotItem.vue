<template>
  <VtsMenuItem :icon="faCamera" v-bind="menuItem">
    {{ $t('snapshot') }}
  </VtsMenuItem>
</template>

<script lang="ts" setup>
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import VtsMenuItem from '@core/components/menu/VtsMenuItem.vue'
import { type MenuLike, useMenuAction } from '@core/packages/menu'
import { faCamera } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  menu: MenuLike
  vmRefs: XenApiVm['$ref'][]
}>()

const { getByOpaqueRef } = useVmStore().subscribe()

const vms = computed(() =>
  props.vmRefs.map(vmRef => getByOpaqueRef(vmRef)).filter((vm): vm is XenApiVm => vm !== undefined)
)

const areSomeVmsSnapshoting = computed(() => vms.value.some(vm => isVmOperationPending(vm, VM_OPERATION.SNAPSHOT)))

const isDisabled = computed(() => vms.value.length === 0 || areSomeVmsSnapshoting.value)

const handleSnapshot = () => {
  const vmRefsToSnapshot = Object.fromEntries(
    vms.value.map(vm => [vm.$ref, `${vm.name_label}_${new Date().toISOString()}`])
  )
  return useXenApiStore().getXapi().vm.snapshot(vmRefsToSnapshot)
}

const menuItem = useMenuAction({
  parent: props.menu,
  handler: handleSnapshot,
  busy: areSomeVmsSnapshoting,
  disabled: isDisabled,
})
</script>
