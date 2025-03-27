<template>
  <div class="vts-quick-info-row">
    <span class="typo-body-bold">
      <slot name="label">
        {{ label }}
      </slot>
    </span>
    <span v-tooltip class="typo-body-regular value text-ellipsis">
      <slot name="value">
        {{ value }}
      </slot>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { vTooltip } from '@core/directives/tooltip.directive'

defineProps<{
  label?: string
  value?: string
}>()

defineSlots<{
  label?(): any
  value?(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-quick-info-row {
  display: flex;
  align-items: center;
  gap: 1rem;

  .value:empty::before {
    content: '-';
  }
}
</style>
