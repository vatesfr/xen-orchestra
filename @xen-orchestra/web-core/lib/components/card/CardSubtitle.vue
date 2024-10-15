<!-- v1.0 -->
<template>
  <div class="card-subtitle">
    <span class="typo h7-semi-bold"><slot /></span>
    <span v-if="$slots.info" class="typo p3-medium"><slot name="info" /></span>
  </div>
</template>

<script setup lang="ts">
defineSlots<{
  default: () => void
  info: () => void
}>()
</script>

<style lang="postcss" scoped>
.card-subtitle {
  color: var(--color-info-txt-base);
  border-bottom: 0.1rem solid var(--color-info-txt-base);
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}
</style>
