<template>
  <span class="inline-parts interpunct-list">
    <slot />
  </span>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>
