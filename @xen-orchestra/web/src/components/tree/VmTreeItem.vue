<template>
  <VtsTreeItem expanded>
    <UiTreeItemLabel :route="`/vm/${leaf.data.id}`" no-indent>
      {{ leaf.data.name_label }}
      <template #icon>
        <VtsObjectIcon
          v-tooltip="leaf.data.power_state"
          :state="leaf.data.power_state.toLocaleLowerCase() as POWER_STATE"
          size="medium"
          type="vm"
        />
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { VmLeaf } from '@/types/tree.type'
import type { POWER_STATE } from '@core/types/power-state.type'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'

defineProps<{
  leaf: VmLeaf
}>()
</script>
