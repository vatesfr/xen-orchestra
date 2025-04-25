<template>
  <div class="vts-quick-info-row">
    <span class="typo-body-regular label">
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
  gap: 2.4rem;

  .label {
    flex-shrink: 0;
    color: var(--color-neutral-txt-secondary);
  }

  .value:empty::before {
    content: '-';
  }

  .value {
    color: var(--color-neutral-txt-primary);
    display: flex;
    align-items: center;
    gap: 0.8rem;

    &:empty::before {
      content: '-';
    }
  }
}
</style>
