<template>
  <div class="vts-flag-legend">
    <VtsIcon name="fa:circle" size="current" class="dot" />
    <span class="typo-body-regular-small">
      <slot />
    </span>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-flag-legend {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--color-info-txt-base);

  .dot {
    font-size: 0.8rem;
  }
}
</style>
