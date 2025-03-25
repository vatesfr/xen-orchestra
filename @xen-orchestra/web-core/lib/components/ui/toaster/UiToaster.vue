<!-- v3 -->
<template>
  <div :class="toVariants({ accent })" class="ui-toaster">
    <div class="content">
      <VtsIcon class="information-icon" :accent :icon="faCircle" :overlay-icon="icon" />
      <div>
        <div class="typo-h5">
          <slot />
        </div>
        <div v-if="slots.description" class="typo-body-regular-small">
          <slot name="description" />
        </div>
      </div>
      <UiButtonIcon class="close-icon" :icon="faXmark" accent="brand" size="medium" @click="emit('close')" />
    </div>
    <div v-if="slots.actions" class="actions">
      <slot name="actions" />
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

type ToasterAccent = 'info' | 'success' | 'warning' | 'danger'

const props = defineProps<{
  accent: ToasterAccent
}>()

const emit = defineEmits<{
  close: []
}>()

const slots = defineSlots<{
  default(): any
  description?(): any
  actions?(): any
}>()

const states: Record<ToasterAccent, IconDefinition> = {
  info: faInfo,
  success: faCheck,
  warning: faExclamation,
  danger: faXmark,
}
const icon = computed(() => states[props.accent])
</script>

<style scoped lang="postcss">
.ui-toaster {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.6rem;
  border: 0.1rem solid;
  border-radius: 0.4rem;
  gap: 0.8rem;

  .content {
    display: flex;
    align-items: flex-start;
    gap: 1.6rem;

    .information-icon {
      font-size: 2.7rem;
    }

    .close-icon {
      margin-inline-start: auto;
      flex-shrink: 0;
    }
  }

  .actions {
    align-self: flex-end;
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
