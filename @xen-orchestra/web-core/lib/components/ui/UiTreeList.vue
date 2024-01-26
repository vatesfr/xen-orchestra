<template>
  <ul class="ui-tree-list">
    <slot />
  </ul>
</template>

<script lang="ts" setup>
import { inject, provide } from 'vue'

const depth = inject('depth', 0)
provide('depth', depth + 1)
</script>
