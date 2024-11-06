<!-- v3 -->
<template>
  <div class="ui-legend-title typo c3-semi-bold">
    <slot />
    <VtsIcon v-tooltip="iconTooltip ?? false" :icon accent="info" />
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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
.ui-legend-title {
  color: var(--color-neutral-txt-secondary);
  display: flex;
  gap: 0.8rem;
  align-items: center;
}
</style>
