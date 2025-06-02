<template>
  <VtsTreeItem :expanded="branch.isExpanded">
    <UiTreeItemLabel :icon="faSatellite" route="/" @toggle="branch.toggleExpand()">
      {{ branch.data.name_label }}
    </UiTreeItemLabel>
    <template v-if="branch.hasChildren" #sublist>
      <PoolTreeList :branches="branch.children" />
    </template>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import PoolTreeList from '@/components/tree/PoolTreeList.vue'
import type { SiteBranch } from '@/types/tree.type'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { faSatellite } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  branch: SiteBranch
}>()
</script>
