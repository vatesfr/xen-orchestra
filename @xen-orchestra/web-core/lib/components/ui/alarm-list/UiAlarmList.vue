<!-- v1 -->
<template>
  <ul class="ui-alarm-list">
    <slot />
  </ul>
</template>

<script setup lang="ts">
defineSlots<{
  default(): any
}>()
</script>

<style scoped lang="postcss">
.ui-alarm-list {
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  border-top: 0.1rem solid var(--color-neutral-border);
  border-bottom: 0.1rem solid var(--color-neutral-border);
}
</style>
