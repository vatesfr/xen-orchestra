<!-- v2 -->
<template>
  <span class="vts-actions-title typo p2-regular">
    <slot />
  </span>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>

<style scoped lang="postcss">
.vts-actions-title {
  color: var(--color-neutral-txt-secondary);
}
</style>
