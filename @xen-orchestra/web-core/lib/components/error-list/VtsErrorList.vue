<template>
  <div class="vts-error-list">
    <VtsIcon name="status:danger-circle" size="medium" class="icon" />
    <ul class="list typo-body-regular-small">
      <slot />
    </ul>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-error-list {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;

  .list {
    list-style: disc;
    padding-inline-start: 1.6rem;
  }
}
</style>
