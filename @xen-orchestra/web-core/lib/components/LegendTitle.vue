<!-- v1.0 -->
<template>
  <div class="legend-title typo c3-semi-bold">
    <slot />
    <UiIcon
      v-tooltip="iconTooltip ?? false"
      :icon
      color="info"
      class="tooltip-icon"
    />
  </div>
</template>

<script setup lang="ts">
import UiIcon from '@core/components/icon/UiIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  iconTooltip?: string
  icon?: IconDefinition
}>()
</script>

<style lang="postcss" scoped>
.legend-title {
  color: var(--color-grey-200);
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.tooltip-icon {
  font-size: 1.2rem;
}
</style>
