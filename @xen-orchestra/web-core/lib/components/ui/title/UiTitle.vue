<!-- v2 -->
<template>
  <div class="ui-title">
    <div class="typo h4-medium label">
      <slot />
    </div>
    <div v-if="slots.actions" class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
const slots = defineSlots<{
  default(): any
  actions?(): any
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

  .actions {
    margin-inline-start: auto;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
