<template>
  <RecycleScroller
    v-if="items.length > 0"
    ref="scroller"
    :items
    :item-size="37"
    :buffer="600"
    key-field="id"
    list-tag="ul"
    item-tag="li"
    class="site-tree-list"
  >
    <template #default="{ item }">
      <TreeNodeRow :node="item.node" :depth="item.depth" />
    </template>
  </RecycleScroller>
</template>

<script lang="ts" setup>
import TreeNodeRow from '@/modules/treeview/components/TreeNodeRow.vue'
import type { FlatTreeNode } from '@core/packages/tree/types.ts'
import { useTemplateRef } from 'vue'
import { RecycleScroller, type RecycleScrollerInstance } from 'vue-virtual-scroller'

defineProps<{
  items: FlatTreeNode[]
}>()

const scroller = useTemplateRef<RecycleScrollerInstance>('scroller')

defineExpose({
  scrollToItem: (index: number) => scroller.value?.scrollToItem(index, { smooth: true }),
})
</script>

<style lang="postcss" scoped>
.site-tree-list {
  background-color: var(--color-neutral-background-primary);
  padding: 0.8rem;
  height: 100%;
  overflow-y: auto;
}
</style>
