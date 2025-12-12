<template>
  <DynamicScroller
    v-if="branches && branches.length > 0"
    :items="branches"
    :min-item-size="37"
    list-tag="ul"
    item-tag="li"
    class="site-tree-list"
  >
    <template #default="{ item: branch, active }">
      <DynamicScrollerItem :item="branch" :active :size-dependencies="[branch.isCollapsed]">
        <SiteTreeItem :key="branch.id" :branch />
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
</template>

<script lang="ts" setup>
import SiteTreeItem from '@/components/tree/SiteTreeItem.vue'
import type { SiteBranch } from '@/types/tree.type'
import { IK_TREE_LIST_DEPTH } from '@core/utils/injection-keys.util'
import { inject, provide } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'

defineProps<{
  branches: SiteBranch[]
}>()

const depth = inject(IK_TREE_LIST_DEPTH, 0)
provide(IK_TREE_LIST_DEPTH, depth + 1)
</script>

<style lang="postcss" scoped>
.site-tree-list {
  background-color: var(--color-neutral-background-primary);
  padding: 0.8rem;
  min-height: 100%;
}
</style>
