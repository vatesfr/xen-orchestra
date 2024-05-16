<!-- v1.1 -->
<template>
  <li class="tree-item">
    <slot />
    <slot v-if="isExpanded" name="sublist" />
  </li>
</template>

<script lang="ts" setup>
import { IK_TREE_ITEM_EXPANDED, IK_TREE_ITEM_HAS_CHILDREN, IK_TREE_ITEM_TOGGLE } from '@core/utils/injection-keys.util'
import { useToggle } from '@vueuse/core'
import { onBeforeMount, onBeforeUpdate, provide, ref, useSlots } from 'vue'

defineSlots<{
  default: () => void
  sublist: () => void
}>()

const [isExpanded, toggle] = useToggle(true)

const hasChildren = ref(false)

const updateHasChildren = () => {
  const { sublist } = useSlots()
  hasChildren.value = sublist !== undefined
}

onBeforeMount(() => updateHasChildren())
onBeforeUpdate(() => updateHasChildren())

provide(IK_TREE_ITEM_HAS_CHILDREN, hasChildren)
provide(IK_TREE_ITEM_TOGGLE, toggle)
provide(IK_TREE_ITEM_EXPANDED, isExpanded)
</script>
