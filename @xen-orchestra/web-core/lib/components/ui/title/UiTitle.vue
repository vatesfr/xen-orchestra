<!-- v5 -->
<template>
  <div class="ui-title">
    <div class="typo-h4 label">
      <slot />
    </div>
    <div v-if="slots.action" class="action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
const slots = defineSlots<{
  default(): any
  action?(): any
}>()
</script>

<style scoped lang="postcss">
.ui-title {
  display: flex;
  align-items: center;
  gap: 2.4rem;
  padding-block-end: 0.4rem;
  border-bottom: 0.1rem solid var(--color-brand-txt-base);

  .label {
    color: var(--color-brand-txt-base);
  }

  .action {
    margin-inline-start: auto;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
