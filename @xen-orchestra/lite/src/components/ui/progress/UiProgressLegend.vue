<template>
  <div class="legend">
    <template v-if="slots.label || label">
      <span class="circle" />
      <div class="label-container">
        <div v-tooltip="{ vertical: true }" class="label">
          <slot name="label">{{ label }}</slot>
        </div>
      </div>
    </template>
    <UiBadge class="badge">
      <slot name="value">{{ value }}</slot>
    </UiBadge>
  </div>
</template>

<script lang="ts" setup>
import UiBadge from '@/components/ui/UiBadge.vue'
import { vTooltip } from '@core/directives/tooltip.directive'

defineProps<{
  label?: string
  value?: string
}>()

const slots = defineSlots<{
  value(): any
  label?(): any
}>()
</script>

<style lang="postcss" scoped>
.badge {
  font-size: 0.9em;
  font-weight: 700;
}

.circle {
  display: inline-block;
  min-width: 1rem;
  min-height: 1rem;
  border-radius: 0.5rem;
  background-color: var(--progress-bar-color);
}

.legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.label-container {
  overflow: hidden;
}

.label {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
