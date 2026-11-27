<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.dataId" :has-children="branch.hasChildren">
    <UiTreeItemLabel
      :route="{ name: '/pool/[uuid]', params: { uuid: branch.data.uuid } }"
      icon="object:pool"
      @toggle="branch.toggleCollapse()"
    >
      {{ branch.data.name_label || '(Pool)' }}
      <template #addons>
        <VtsActionsMenu placement="bottom-start">
          <PoolTreeActions :pool="branch.data" />
        </VtsActionsMenu>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import PoolTreeActions from '@/modules/pool/components/actions/PoolTreeActions.vue'
import type { PoolBranch } from '@/modules/treeview/types/tree.type.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'

defineProps<{
  branch: PoolBranch
}>()
</script>
