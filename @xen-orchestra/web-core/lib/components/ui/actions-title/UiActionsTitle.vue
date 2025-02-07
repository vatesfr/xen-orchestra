<!-- v2 -->
<template>
  <span class="ui-actions-title typo-body-regular-small">
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
