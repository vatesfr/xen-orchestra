<!-- v3 -->
<template>
  <div :class="toVariants({ accent })" class="ui-alert">
    <div class="content">
      <VtsIcon class="information-icon" :name="icon" size="current" />
      <div class="alert typo-body-regular-small">
        <div>
          <slot />
        </div>
        <div v-if="slots.description">
          <slot name="description" />
        </div>
      </div>
      <UiButtonIcon
        v-if="close"
        class="close-button"
        icon="fa:xmark"
        accent="brand"
        size="small"
        @click="emit('close')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper'
import { toVariants } from '@core/utils/to-variants.util'

type AlertAccent = 'info' | 'success' | 'warning' | 'danger'

const { accent } = defineProps<{
  accent: AlertAccent
  close?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const slots = defineSlots<{
  default(): any
  description?(): any
}>()

const icon = useMapper<AlertAccent, IconName>(
  () => accent,
  {
    info: 'status:info-circle',
    success: 'status:success-circle',
    warning: 'status:warning-circle',
    danger: 'status:danger-circle',
  },
  'info'
)
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

    .close-button {
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
