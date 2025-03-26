<!-- v3 -->
<template>
  <div :class="toVariants({ accent })" class="ui-alert">
    <div class="content">
      <VtsIcon class="information-icon" :accent :icon="faCircle" :overlay-icon="icon" />
      <div class="alert">
        <div class="typo-body-regular-small">
          <slot />
        </div>
        <div v-if="slots.description" class="typo-body-regular-small">
          <slot name="description" />
        </div>
      </div>
      <UiButtonIcon v-if="close" class="close-icon" :icon="faXmark" accent="brand" size="medium" />
    </div>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCheck, faCircle, faExclamation, faInfo, faXmark } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

type AlertAccent = 'info' | 'success' | 'warning' | 'danger'

const { accent } = defineProps<{
  accent: AlertAccent
  close?: boolean
}>()

const slots = defineSlots<{
  default(): any
  description?(): any
}>()

const states: Record<AlertAccent, IconDefinition> = {
  info: faInfo,
  success: faCheck,
  warning: faExclamation,
  danger: faXmark,
}
const icon = computed(() => states[accent])
</script>

<style scoped lang="postcss">
.ui-alert {
  padding: 1.6rem;
  border: 0.1rem solid;
  border-radius: 0.4rem;

  .content {
    display: flex;
    align-items: flex-start;
    gap: 1.6rem;

    .information-icon {
      font-size: 2.7rem;
    }

    .alert {
      align-self: center;
    }

    .close-icon {
      margin-inline-start: auto;
      flex-shrink: 0;
    }
  }

  &.accent--info {
    background-color: var(--color-info-background-selected);
    border-color: var(--color-info-item-base);
  }

  &.accent--success {
    background-color: var(--color-success-background-selected);
    border-color: var(--color-success-item-base);
  }

  &.accent--warning {
    background-color: var(--color-warning-background-selected);
    border-color: var(--color-warning-item-base);
  }

  &.accent--danger {
    background-color: var(--color-danger-background-selected);
    border-color: var(--color-danger-item-base);
  }
}
</style>
