<template>
  <li class="ui-tree-item">
    <slot />
    <slot v-if="isExpanded" name="sublist" />
  </li>
</template>

<script lang="ts" setup>
import { IK_LIST_ITEM_EXPANDED, IK_LIST_ITEM_HAS_CHILDREN, IK_LIST_ITEM_TOGGLE } from '@core/utils/injection-keys.util'
import { useToggle } from '@vueuse/core'
import { computed, provide } from 'vue'

const slots = defineSlots<{
  default: () => void
  sublist: () => void
}>()

const [isExpanded, toggle] = useToggle(true)

const hasChildren = computed(() => slots.sublist !== undefined)
provide(IK_LIST_ITEM_HAS_CHILDREN, hasChildren)
provide(IK_LIST_ITEM_TOGGLE, toggle)
provide(IK_LIST_ITEM_EXPANDED, isExpanded)
</script>
