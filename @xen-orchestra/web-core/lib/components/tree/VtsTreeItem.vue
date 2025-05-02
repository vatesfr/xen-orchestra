<template>
  <li class="vts-tree-item" @click="handleClick">
    <slot />
    <slot v-if="expanded" name="sublist" />
  </li>
</template>

<script lang="ts" setup>
import { useSidebarStore } from '@core/stores/sidebar.store'
import { IK_TREE_ITEM_EXPANDED, IK_TREE_ITEM_HAS_CHILDREN } from '@core/utils/injection-keys.util'
import { onBeforeMount, onBeforeUpdate, provide, ref, toRef, useSlots } from 'vue'

const props = defineProps<{
  expanded?: boolean
}>()

defineSlots<{
  default(): any
  sublist?(): any
}>()

const sidebar = useSidebarStore()
const hasChildren = ref(false)

const updateHasChildren = () => {
  const { sublist } = useSlots()
  hasChildren.value = sublist !== undefined
}

const handleClick = () => {
  if (!hasChildren.value) {
    sidebar.toggleExpand()
  }
}

onBeforeMount(() => updateHasChildren())
onBeforeUpdate(() => updateHasChildren())

provide(IK_TREE_ITEM_HAS_CHILDREN, hasChildren)
provide(IK_TREE_ITEM_EXPANDED, toRef(props, 'expanded'))
</script>
