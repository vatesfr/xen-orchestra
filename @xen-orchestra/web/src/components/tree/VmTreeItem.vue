<template>
  <TreeItem expanded>
    <TreeItemLabel :route="`/vm/${leaf.data.id}/console`" no-indent>
      {{ leaf.data.name_label }}
      <template #icon>
        <ObjectIcon :state="leaf.data.power_state.toLocaleLowerCase() as POWER_STATE" size="small" type="vm" />
      </template>
    </TreeItemLabel>
  </TreeItem>
</template>

<script lang="ts" setup>
import type { VmLeaf } from '@/types/vm.type'
import type { POWER_STATE } from '@core/types/power-state.type'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'

defineProps<{
  leaf: VmLeaf
}>()
</script>
