<!-- v1 -->
<template>
  <div class="ui-group-subcategory">
    <span class="title typo-caption-small"><slot /></span>
    <span v-if="slots.info" class="info typo-body-regular-small"><slot name="info" /></span>
  </div>
</template>

<script setup lang="ts">
const slots = defineSlots<{
  default(): any
  info?(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-group-subcategory {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--color-neutral-txt-secondary);
  overflow-wrap: break-word;

  .title {
    flex: 1;
    min-width: 0;
  }

  .info {
    white-space: nowrap;
  }
}
</style>
