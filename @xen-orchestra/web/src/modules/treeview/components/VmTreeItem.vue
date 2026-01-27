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
        <UiLoader v-if="isAnyJobRunning" />
        <MenuList placement="bottom-start">
          <template #trigger="{ open }">
            <UiButtonIcon icon="fa:ellipsis" accent="brand" size="small" @click="open($event)" />
          </template>
          <VmActions :vm="leaf.data" />
        </MenuList>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { VmLeaf } from '@/modules/treeview/types/tree.type.ts'
import VmActions from '@/modules/vm/components/actions/VmActions.vue'
import { useXoVmJobRunning } from '@/modules/vm/composables/xo-vm-job-running.composable.ts'
import type { POWER_STATE } from '@core/types/power-state.type.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'

const { leaf } = defineProps<{
  leaf: VmLeaf
}>()

const { isAnyJobRunning } = useXoVmJobRunning(() => leaf.data)
</script>
