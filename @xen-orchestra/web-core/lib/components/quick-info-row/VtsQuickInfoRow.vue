<template>
  <div class="vts-quick-info-row" :class="{ mobile: uiStore.isMobile }">
    <span v-tooltip class="typo-body-regular label text-ellipsis">
      <slot name="label">
        {{ label }}
      </slot>
    </span>
    <span class="typo-body-regular value">
      <slot name="value">
        {{ value }}
      </slot>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store.ts'

defineProps<{
  label?: string
  value?: string
}>()

defineSlots<{
  label?(): any
  value?(): any
}>()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.vts-quick-info-row {
  display: flex;
  gap: 2.4rem;

  &.mobile {
    flex-direction: column;
    gap: 0.8rem;
  }

  .label {
    flex-shrink: 0;
    color: var(--color-neutral-txt-secondary);
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
