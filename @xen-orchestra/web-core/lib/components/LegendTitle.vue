<!-- v1.0 -->
<template>
  <div class="legend-title typo c3-semi-bold">
    <slot />
    <UiIcon v-tooltip="iconTooltip ?? false" :icon color="info" />
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

export type LegendTitleProps = {
  iconTooltip?: string
  icon?: IconDefinition
}

defineProps<LegendTitleProps>()

defineSlots<{
  default(): void
}>()
</script>

<style lang="postcss" scoped>
.legend-title {
  color: var(--color-neutral-txt-secondary);
  display: flex;
  gap: 0.8rem;
  align-items: center;
}
</style>
