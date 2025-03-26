<template>
  <div class="vts-tree-item">
    <slot />
    <slot v-if="expanded" name="sublist" />
  </div>
</template>

<script lang="ts" setup>
import { IK_TREE_ITEM_EXPANDED, IK_TREE_ITEM_HAS_CHILDREN } from '@core/utils/injection-keys.util'
import { onBeforeMount, onBeforeUpdate, provide, ref, toRef, useSlots } from 'vue'

const props = defineProps<{
  expanded?: boolean
}>()

defineSlots<{
  default(): any
  sublist?(): any
}>()

const hasChildren = ref(false)

const updateHasChildren = () => {
  const { sublist } = useSlots()
  hasChildren.value = sublist !== undefined
}

onBeforeMount(() => updateHasChildren())
onBeforeUpdate(() => updateHasChildren())

provide(IK_TREE_ITEM_HAS_CHILDREN, hasChildren)
provide(IK_TREE_ITEM_EXPANDED, toRef(props, 'expanded'))
</script>
