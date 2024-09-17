<!-- v1.0 -->
<template>
  <div class="head-bar">
    <div class="label-wrapper">
      <span v-if="slots.icon || icon" class="icon">
        <slot name="icon">
          <UiIcon :icon color="current" />
        </slot>
      </span>
      <h4 v-tooltip class="typo h4-medium label text-ellipsis">
        <slot />
      </h4>
    </div>
    <div v-if="slots.status" class="status typo c3-regular">
      <slot name="status" />
    </div>
    <div v-if="slots.actions" class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  icon?: IconDefinition
}>()

const slots = defineSlots<{
  default: () => any
  icon?: () => any
  status?: () => any
  actions?: () => any
}>()
</script>

<style lang="postcss" scoped>
.head-bar {
  padding: 0.8rem 1.6rem;
  display: flex;
  gap: 4.8rem;
  align-items: center;
  border-bottom: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
}

.label-wrapper {
  display: flex;
  gap: 1.6rem;
  align-items: center;
  min-width: 0;
}

.label {
  color: var(--color-neutral-txt-primary);
}

.icon {
  font-size: 2.4rem;
}

.status {
  color: var(--color-neutral-txt-secondary);
  display: flex;
  align-items: center;
  gap: 1.6rem;
}

.actions {
  margin-inline-start: auto;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
