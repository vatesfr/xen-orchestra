<!-- v2 -->
<template>
  <span class="ui-actions-title typo p2-regular">
    <slot />
  </span>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>

<style scoped lang="postcss">
.ui-actions-title {
  color: var(--color-neutral-txt-secondary);
}
</style>
