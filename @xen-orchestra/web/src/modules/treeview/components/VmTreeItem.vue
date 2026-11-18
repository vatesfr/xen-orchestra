<template>
  <VtsTreeItem expanded :node-id="leaf.data.id">
    <UiTreeItemLabel :route="`/vm/${leaf.data.id}`" no-indent>
      {{ leaf.data.name_label }}
      <template #icon>
        <VtsIcon :name="vmIcon" :tooltip="vmIconTooltip" size="medium" />
      </template>
      <template #addons>
        <UiLoader
          v-if="hasPendingOperation"
          v-tooltip="{
            placement: 'top',
            content: currentOperation,
          }"
        />
        <VtsActionsMenu placement="bottom-start">
          <VmActions :vm="leaf.data" />
        </VtsActionsMenu>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { VmLeaf } from '@/modules/treeview/types/tree.type.ts'
import VmActions from '@/modules/vm/components/actions/VmActions.vue'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { getVmIcon } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'

const { leaf } = defineProps<{
  leaf: VmLeaf
}>()

const { powerState, hasPendingOperation, currentOperation, iconTooltip } = useXoVmUtils(() => leaf.data)

const vmIcon = computed(() => getVmIcon(leaf.data))

const vmIconTooltip = computed(() => iconTooltip.value || powerState.value.text)
</script>
