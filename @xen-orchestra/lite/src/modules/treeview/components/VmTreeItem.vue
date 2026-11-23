<template>
  <VtsTreeItem :node-id="leaf.dataId" expanded>
    <UiTreeItemLabel :route="{ name: '/vm/[uuid]', params: { uuid: leaf.data.uuid } }" no-indent>
      {{ leaf.data.name_label || '(VM)' }}
      <template #icon>
        <VtsObjectIcon v-tooltip="powerState.text" :state="vmState" size="medium" type="vm" />
      </template>
      <template #addons>
        <UiLoader v-if="isChangingState" v-tooltip="{ placement: 'top', content: currentOperation }" />
        <VtsActionsMenu placement="bottom-start">
          <VmTreeActions :vm-opaque-ref="leaf.data.$ref" />
        </VtsActionsMenu>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { VmLeaf } from '@/modules/treeview/types/tree.type.ts'
import VmTreeActions from '@/modules/vm/components/actions/VmTreeActions.vue'
import { useVmOperation } from '@/modules/vm/composables/vm-operation.composable.ts'
import { useVmUtils } from '@/modules/vm/composables/vm-utils.composable.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'

const { leaf } = defineProps<{
  leaf: VmLeaf
}>()

const { isChangingState, currentOperation } = useVmOperation(() => leaf.data)
const { powerState } = useVmUtils(() => leaf.data)

const vmState = computed(() => toLower(leaf.data.power_state))
</script>
