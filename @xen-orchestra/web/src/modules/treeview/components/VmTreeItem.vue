<template>
  <VtsTreeItem expanded :node-id="leaf.data.id">
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
      <template #addons>
        <UiLoader
          v-if="isChangingState"
          v-tooltip="{
            placement: 'top',
            content: currentOperation,
          }"
        />
        <VmActionsMenu :vm="leaf.data" />
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { VmLeaf } from '@/modules/treeview/types/tree.type.ts'
import VmActionsMenu from '@/modules/vm/components/actions/VmActionsMenu.vue'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { POWER_STATE } from '@core/types/power-state.type.ts'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'

const { leaf } = defineProps<{
  leaf: VmLeaf
}>()

const { isChangingState, currentOperation } = useXoVmUtils(() => leaf.data)
</script>
