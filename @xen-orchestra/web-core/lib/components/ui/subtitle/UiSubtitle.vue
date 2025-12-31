<!-- v1 -->
<template>
  <div class="ui-subtitle typo-h6">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineSlots<{
  default(): any
}>()
</script>

<style scoped lang="postcss">
.ui-subtitle {
  color: var(--color-neutral-txt-primary);
}
</style>
