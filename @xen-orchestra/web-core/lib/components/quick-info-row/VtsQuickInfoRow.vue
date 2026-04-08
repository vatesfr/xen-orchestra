<template>
  <div class="vts-quick-info-row">
    <span class="typo-body-regular label">
      <slot name="label">
        {{ label }}
      </slot>
    </span>
    <span class="typo-body-regular value">
      <span v-tooltip class="text-ellipsis">
        <slot name="value">
          {{ value }}
        </slot>
      </span>
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
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 2;
  align-items: start;

  @container vts-quick-info-column (max-width: 40rem) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.8rem;
  }

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
      flex: 1;

      &:empty::before {
        content: '-';
      }
    }
  }
}
</style>
