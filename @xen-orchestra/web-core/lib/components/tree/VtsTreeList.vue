<template>
  <ul class="vts-tree-list">
    <slot />
  </ul>
</template>

<script lang="ts" setup>
import { IK_TREE_LIST_DEPTH } from '@core/utils/injection-keys.util'
import { inject, provide } from 'vue'

defineSlots<{
  default(): any
}>()

const depth = inject(IK_TREE_LIST_DEPTH, 0)
provide(IK_TREE_LIST_DEPTH, depth + 1)
</script>
