<template>
  <div :class="toasterClass" class="ui-toaster">
    <div class="label">
      <VtsIcon class="icon" :accent="props.accent" :icon="faCircle" :overlay-icon="icon" />
      <div class="content">
        <div class="typo h5-semi-bold">
          <slot />
        </div>
        <div v-if="slots.description" class="description typo p2-regular">
          <slot name="description" />
        </div>
      </div>
      <UiButton class="close-icon" level="tertiary" :color="props.accent" size="medium" :left-icon="faXmark" />
    </div>
    <div v-if="slots.actions" class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import UiButton from '@core/components/button/UiButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faXmark, faCheck, faCircle, faInfo, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  accent: Color
}>()

const slots = defineSlots<{
  default(): any
  description?(): any
  actions?(): any
}>()

type Color = 'brand' | 'success' | 'warning' | 'danger'

const states: Record<Color, { icon: IconDefinition; color: 'brand' | 'success' | 'warning' | 'danger' }> = {
  brand: { icon: faInfo, color: 'brand' },
  success: { icon: faCheck, color: 'success' },
  warning: { icon: faExclamation, color: 'warning' },
  danger: { icon: faXmark, color: 'danger' },
}

const icon = computed(() => states[props.accent].icon)

const toasterClass = computed(() => {
  return [props.accent]
})
</script>

<style scoped lang="postcss">
.ui-toaster {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.6rem;
  border: 0.1rem solid;
  border-radius: 0.4rem;

  .label {
    display: flex;
    justify-items: center;

    .icon {
      margin-bottom: auto;
      font-size: 2.7rem;
      padding-right: 8px;
    }

    .close-icon {
      margin-left: auto;
    }

    .content {
      display: flex;
      flex-direction: column;
    }
  }

  .actions {
    color: var(--color-normal-txt-base);
    display: flex;
    justify-content: flex-end;
  }

  &.brand {
    background-color: var(--color-normal-background-selected);
    border-color: var(--color-normal-item-base);
  }

  &.success {
    background-color: var(--color-success-background-selected);
    border-color: var(--color-success-item-base);
  }

  &.warning {
    background-color: var(--color-warning-background-selected);
    border-color: var(--color-warning-item-base);
  }

  &.danger {
    background-color: var(--color-danger-background-selected);
    border-color: var(--color-danger-item-base);
  }
}
</style>
