<template>
  <span class="interpunct-list">
    <slot />
  </span>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>
