<!-- v1.0 -->
<template>
  <li class="legend">
    <span class="circle" :class="circleColorClass"></span><span class="label typo p3-regular">{{ label }}</span
    ><UiIcon
      v-tooltip="{
        placement: 'top',
        content: tooltip ? $t(tooltip) : '',
      }"
      :icon="tooltip ? faCircleInfo : undefined"
      color="info"
      class="ui-icon"
    />

    <span class="value-and-unit typo c3-semi-bold">{{ value }} {{ unit }}</span>
  </li>
</template>

<script setup lang="ts">
import UiIcon from '@core/components/icon/UiIcon.vue'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { vTooltip } from '@core/directives/tooltip.directive'
import { computed } from 'vue'

const props = defineProps<{
  value?: number
  state: 'success' | 'warning' | 'error' | 'disabled' | 'dark-blue' | 'default'
  label: string
  unit?: string
  tooltip?: string
}>()

const circleColorClass = computed(() => {
  switch (props.state) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    case 'disabled':
      return 'disabled'
    case 'dark-blue':
      return 'dark-blue'
    default:
      return 'default'
  }
})
</script>

<style lang="postcss" scoped>
.legend {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.circle {
  width: 0.8rem;
  height: 0.8rem;
  min-width: 0.8rem;
  border-radius: 50%;
  background-color: var(--label-color);

  &.success {
    --label-color: var(--color-green-base);
  }
  &.warning {
    --label-color: var(--color-orange-base);
  }
  &.error {
    --label-color: var(--color-red-base);
  }
  &.default {
    --label-color: var(--color-purple-base);
  }
  &.disabled {
    --label-color: var(--color-grey-300);
  }
  &.dark-blue {
    --label-color: var(--color-grey-100);
  }
}

.label {
  color: var(--color-grey-000);
}

.ui-icon {
  font-size: 1.2rem;
}

.value-and-unit {
  color: var(--color-grey-300);
  margin-left: auto;
}
</style>
