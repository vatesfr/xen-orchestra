<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.dataId" :has-children="branch.hasChildren">
    <UiTreeItemLabel
      :route="{ name: '/pool/[uuid]', params: { uuid: branch.data.uuid } }"
      icon="object:pool"
      @toggle="branch.toggleCollapse()"
    >
      {{ branch.data.name_label || '(Pool)' }}
      <template #addons>
        <MenuList placement="bottom-start">
          <template #trigger="{ open, isOpen }">
            <UiButtonIcon
              accent="brand"
              icon="action:more-actions"
              size="small"
              :selected="isOpen"
              @click="open($event)"
            />
          </template>
          <PoolTreeActions :pool="branch.data" />
        </MenuList>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import PoolTreeActions from '@/modules/pool/components/actions/PoolTreeActions.vue'
import type { PoolBranch } from '@/modules/treeview/types/tree.type.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'

defineProps<{
  branch: PoolBranch
}>()
</script>
