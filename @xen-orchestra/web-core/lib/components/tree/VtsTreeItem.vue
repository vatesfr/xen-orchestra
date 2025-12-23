<template>
  <div class="vts-tree-item" :data-node-id="nodeId" @click="handleClick()">
    <slot />
    <slot v-if="expanded" name="sublist" />
  </div>
</template>

<script lang="ts" setup>
import type { TreeNodeId } from '@core/packages/tree/types.ts'
import { useSidebarStore } from '@core/stores/sidebar.store'
import { useUiStore } from '@core/stores/ui.store'
import { IK_TREE_ITEM_EXPANDED, IK_TREE_ITEM_HAS_CHILDREN } from '@core/utils/injection-keys.util'
import { onBeforeMount, onBeforeUpdate, provide, ref, toRef, useSlots } from 'vue'

const props = defineProps<{
  nodeId?: TreeNodeId
  expanded?: boolean
}>()

defineSlots<{
  default(): any
  sublist?(): any
}>()

const sidebar = useSidebarStore()
const uiStore = useUiStore()
const hasChildren = ref(false)

const updateHasChildren = () => {
  const { sublist } = useSlots()
  hasChildren.value = sublist !== undefined
}

const handleClick = () => {
  if (uiStore.isMobile) {
    sidebar.toggleExpand(false)
  }
}

onBeforeMount(() => updateHasChildren())
onBeforeUpdate(() => updateHasChildren())

provide(IK_TREE_ITEM_HAS_CHILDREN, hasChildren)
provide(IK_TREE_ITEM_EXPANDED, toRef(props, 'expanded'))
</script>
