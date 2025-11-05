<!-- v1 -->
<template>
  <div class="ui-data-ruler typo-body-regular-small">
    <span>{{ n(0, 'percent') }}</span>
    <span>{{ n(max / 200, 'percent') }}</span>
    <span class="max">
      <VtsIcon
        v-if="warning?.accent || warning?.tooltip"
        v-tooltip="warning.tooltip ?? false"
        :class="warning.accent ?? 'warning'"
        class="icon"
        name="fa:exclamation-circle"
        size="small"
      />
      {{ n(max / 100, 'percent') }}</span
    >
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { max = 100 } = defineProps<{
  max?: number
  warning?: {
    accent?: 'info' | 'warning' | 'danger'
    tooltip?: string
  }
}>()

const { n } = useI18n()
</script>

<style lang="postcss" scoped>
.ui-data-ruler {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  color: var(--color-neutral-txt-secondary);

  .icon {
    &.warning {
      color: var(--color-warning-item-base);
    }

    &.danger {
      color: var(--color-danger-item-base);
    }
  }

  .max {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  & > span:first-child {
    justify-self: start;
  }

  & > span:nth-child(2) {
    justify-self: center;
  }

  & > span:last-child {
    justify-self: end;
  }
}
</style>
