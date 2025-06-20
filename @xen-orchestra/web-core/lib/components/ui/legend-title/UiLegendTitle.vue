<!-- v3 -->
<template>
  <div class="ui-legend-title typo-caption-small">
    <slot />
    <VtsIcon v-tooltip="iconTooltip ?? false" :name="icon" size="medium" />
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconName } from '@core/icons'

export type LegendTitleProps = {
  iconTooltip?: string
  icon?: IconName
}

defineProps<LegendTitleProps>()

defineSlots<{
  default(): void
}>()
</script>

<style lang="postcss" scoped>
.ui-legend-title {
  color: var(--color-neutral-txt-secondary);
  display: flex;
  gap: 0.8rem;
  align-items: center;
}
</style>
