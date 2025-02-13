<!-- v1 -->
<template>
  <div class="ui-card-subtitle typo-body-bold-small">
    <span><slot /></span>
    <span v-if="slots.info"><slot name="info" /></span>
  </div>
</template>

<script setup lang="ts">
const slots = defineSlots<{
  default(): any
  info?(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-card-subtitle {
  color: var(--color-brand-txt-base);
  border-bottom: 0.1rem solid var(--color-brand-txt-base);
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}
</style>
