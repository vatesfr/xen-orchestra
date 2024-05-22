<!-- v1.0 -->
<template>
  <div class="legend-title typo c3-semi-bold">
    {{ title }}
    <UiIcon
      v-tooltip="{
        placement: 'top',
        content: tooltip ? $t(tooltip) : '',
      }"
      :icon="tooltip ? faInfoCircle : undefined"
      color="info"
    />
  </div>
</template>

<script setup lang="ts">
import UiIcon from '@core/components/icon/UiIcon.vue'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { vTooltip } from '@core/directives/tooltip.directive'

defineProps<{
  title: string
  tooltip?: string
}>()
</script>

<style lang="postcss" scoped>
.legend-title {
  color: var(--color-grey-200);
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.ui-icon {
  font-size: 1.6rem;
}
</style>
