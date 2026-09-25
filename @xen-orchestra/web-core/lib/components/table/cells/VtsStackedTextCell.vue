<template>
  <UiTableCell>
    <div class="vts-stacked-text-cell">
      <span v-tooltip class="primary typo-body-regular text-ellipsis">
        <slot />
      </span>
      <span v-if="secondary" v-tooltip class="secondary typo-body-regular-small text-ellipsis">
        {{ secondary }}
      </span>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'

export type VtsStackedTextCellProps = {
  secondary?: string
}

defineProps<VtsStackedTextCellProps>()

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-stacked-text-cell {
  display: flex;
  flex-direction: column;
  max-width: 30rem;

  .primary {
    color: var(--color-neutral-txt-primary);
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
