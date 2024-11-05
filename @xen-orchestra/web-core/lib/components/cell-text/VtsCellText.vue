<!-- WIP -->
<template>
  <td class="vts-cell-text">
    <div class="data typo p2-regular">
      <span v-tooltip class="text-ellipsis">
        <slot />
      </span>
      <span v-if="slots.secondary" class="info typo p4-regular">
        <slot name="secondary" />
      </span>
    </div>
  </td>
</template>

<script lang="ts" setup>
import { vTooltip } from '@core/directives/tooltip.directive'

const slots = defineSlots<{
  default: () => any
  secondary?: () => any
}>()
</script>

<style lang="postcss" scoped>
.vts-cell-text {
  padding: 0.8rem;
  border: 0.1rem solid var(--color-neutral-border);
  color: var(--color-neutral-txt-primary);

  .data {
    display: flex;
    gap: 1.6rem;
    align-items: center;
  }

  .info {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
