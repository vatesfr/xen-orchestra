<template>
  <RecycleScroller
    v-if="items.length > 0"
    ref="scroller"
    :items
    :item-size="TREE_ITEM_SMALL_HEIGHT"
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
import { type FlatTreeNode, TREE_ITEM_SMALL_HEIGHT } from '@core/packages/tree/types.ts'
import { IK_TREE_ITEM_LABEL_SIZE } from '@core/utils/injection-keys.util.ts'
import { provide, useTemplateRef } from 'vue'
import { RecycleScroller, type RecycleScrollerInstance } from 'vue-virtual-scroller'

defineProps<{
  items: FlatTreeNode[]
}>()

provide(IK_TREE_ITEM_LABEL_SIZE, 'small')

const scroller = useTemplateRef<RecycleScrollerInstance>('scroller')

defineExpose({
  scrollToItem: (index: number) => scroller.value?.scrollToItem(index, { smooth: true, align: 'center' }),
})
</script>

<style lang="postcss" scoped>
.site-tree-list {
  background-color: var(--color-neutral-background-primary);
  padding: 0.4rem 0;
  height: 100%;
  overflow-y: auto;
}
</style>
