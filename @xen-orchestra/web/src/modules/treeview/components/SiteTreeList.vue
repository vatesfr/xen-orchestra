<template>
  <DynamicScroller
    v-if="items.length > 0"
    ref="scroller"
    :items="items"
    :min-item-size="37"
    key-field="id"
    list-tag="ul"
    item-tag="li"
    class="site-tree-list"
  >
    <template #default="{ item, active }">
      <DynamicScrollerItem :item="item" :active :size-dependencies="[]">
        <TreeNodeRow :node="item.node" :depth="item.depth" />
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
</template>

<script lang="ts" setup>
import TreeNodeRow from '@/modules/treeview/components/TreeNodeRow.vue'
import type { FlatTreeNode } from '@core/packages/tree/types'
import { useTemplateRef } from 'vue'
import { DynamicScroller, DynamicScrollerItem, type RecycleScrollerInstance } from 'vue-virtual-scroller'

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
