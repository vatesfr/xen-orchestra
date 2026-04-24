<template>
  <dt class="typo-body-regular label">
    <slot name="label">
      {{ label }}
    </slot>
  </dt>
  <dd class="typo-body-regular value">
    <span v-tooltip class="text-ellipsis">
      <slot name="value">
        {{ value }}
      </slot>
    </span>
  </dd>
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
.label {
  color: var(--color-neutral-txt-secondary);
}

.value {
  color: var(--color-neutral-txt-primary);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;

  .text-ellipsis {
    &:empty::before {
      content: '-';
    }
  }
}
</style>
