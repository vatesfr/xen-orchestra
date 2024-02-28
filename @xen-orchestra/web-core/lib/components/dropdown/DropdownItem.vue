<template>
  <div :class="[colorContextClass, { disabled, selected }]" class="dropdown-item">
    <UiIcon v-if="checkbox" :color="disabled ? undefined : baseColorName" :icon="selected ? faSquareCheck : faSquare" />
    <slot name="icon">
      <UiIcon :icon />
    </slot>
    <div class="label p2 medium">
      <slot />
    </div>
    <div v-if="info" class="info p3 italic">{{ info }}</div>
    <UiIcon v-if="arrow" :color="disabled ? undefined : 'info'" :icon="faAngleRight" class="right-icon" />
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { useContext } from '@core/composables/context.composable'
import { ColorContext } from '@core/context'
import type { Color } from '@core/types/color.type'
import { IK_DROPDOWN_CHECKBOX } from '@core/utils/injection-keys.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faSquare } from '@fortawesome/free-regular-svg-icons'
import { faAngleRight, faSquareCheck } from '@fortawesome/free-solid-svg-icons'
import { computed, inject } from 'vue'

const props = withDefaults(
  defineProps<{
    arrow?: boolean
    color?: Color
    disabled?: boolean
    icon?: IconDefinition
    info?: string
    selected?: boolean
  }>(),
  { color: 'info-alt' }
)

const { colorContextClass, baseName: baseColorName } = useContext(ColorContext, () => props.color)

const checkbox = inject(
  IK_DROPDOWN_CHECKBOX,
  computed(() => false)
)
</script>

<style lang="postcss" scoped>
.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  gap: 0.8rem;
  height: 3.7rem;
  color: var(--color);
  background: var(--background-color);
  border-radius: 0.4rem;
  margin: 0 0.4rem;

  --color: var(--color-context-primary);
  --background-color: var(--color-context-tertiary);

  &:not(.disabled) {
    &.selected,
    &.active {
      --background-color: var(--color-context-secondary);
    }

    &:hover,
    &.hover {
      --background-color: var(--color-context-secondary-hover);
    }

    &:active,
    &.pressed {
      --background-color: var(--color-context-secondary-active);
    }
  }

  &.disabled {
    --color: var(--color-context-primary-disabled);
    --background-color: var(--color-context-tertiary);
  }
}

.label {
  margin-right: auto;
}

.info {
  color: var(--color-grey-300);
}
</style>
