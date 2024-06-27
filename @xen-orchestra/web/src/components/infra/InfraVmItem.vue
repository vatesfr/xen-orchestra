<template>
  <TreeItem>
    <TreeItemLabel :route="`/vm/${vm.id}/console`" no-indent>
      {{ vm.label }}
      <template #icon>
        <ObjectIcon :state="vm.data.power_state.toLocaleLowerCase() as POWER_STATE" size="small" type="vm" />
      </template>
    </TreeItemLabel>
  </TreeItem>
</template>

<script lang="ts" setup>
import type { Vm } from '@/types/vm.type'
import type { Leaf } from '@core/composables/tree/leaf'
import type { POWER_STATE } from '@core/types/power-state.type'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'

defineProps<{
  vm: Leaf<Vm>
}>()
</script>
