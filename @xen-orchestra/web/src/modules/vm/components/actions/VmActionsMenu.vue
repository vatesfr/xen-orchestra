<template>
  <VtsActionsMenu :actions="filteredActions" />
</template>

<script setup lang="ts">
import { useVmRowActions, type VmActionName } from '@/modules/vm/composables/use-vm-row-actions.composable.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import { computed } from 'vue'

const props = defineProps<{
  vm: FrontXoVm
  include?: VmActionName[]
}>()

const { getVmById } = useXoVmCollection()
const vm = computed(() => getVmById(props.vm.id) ?? props.vm)

const { actions } = useVmRowActions(vm)

const filteredActions = computed(() => {
  if (!props.include || props.include.length === 0) {
    return actions.value
  }
  return actions.value.filter(action => action.name !== undefined && props.include!.includes(action.name))
})
</script>
