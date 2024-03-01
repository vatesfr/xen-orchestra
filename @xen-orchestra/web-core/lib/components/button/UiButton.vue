<template>
  <button :class="className" :disabled="busy || isDisabled" :type="type || 'button'" class="ui-button">
    <UiSpinner v-if="busy" />
    <template v-else>
      <UiIcon :icon class="icon" />
      <slot />
    </template>
  </button>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import UiSpinner from '@core/components/UiSpinner.vue'
import { useContext } from '@core/composables/context.composable'
import { ColorContext, DisabledContext } from '@core/context'
import type { Color } from '@core/types/color.type'
import {
  IK_BUTTON_GROUP_OUTLINED,
  IK_BUTTON_GROUP_TRANSPARENT,
  IK_BUTTON_GROUP_UNDERLINED,
} from '@core/utils/injection-keys.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed, inject } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'reset' | 'submit'
    busy?: boolean
    disabled?: boolean
    icon?: IconDefinition
    color?: Color
    outlined?: boolean
    transparent?: boolean
    active?: boolean
    underlined?: boolean
  }>(),
  {
    disabled: undefined,
    outlined: undefined,
    transparent: undefined,
    underlined: undefined,
  }
)

const isDisabled = useContext(DisabledContext, () => props.disabled)

const isGroupOutlined = inject(
  IK_BUTTON_GROUP_OUTLINED,
  computed(() => false)
)

const isGroupTransparent = inject(
  IK_BUTTON_GROUP_TRANSPARENT,
  computed(() => false)
)

const isGroupUnderlined = inject(
  IK_BUTTON_GROUP_UNDERLINED,
  computed(() => false)
)

const { colorContextClass } = useContext(ColorContext, () => props.color)

const className = computed(() => {
  return [
    colorContextClass.value,
    {
      busy: props.busy,
      active: props.active,
      disabled: isDisabled.value,
      outlined: props.outlined ?? isGroupOutlined.value,
      transparent: props.transparent ?? isGroupTransparent.value,
      underlined: props.underlined ?? isGroupUnderlined.value,
    },
  ]
})
</script>

<style lang="postcss" scoped>
.ui-button {
  --button-accent-color: var(--color-context-primary);
  align-items: center;
  background-color: var(--button-accent-color);
  border: 1px solid transparent;
  border-radius: 0.5em;
  color: var(--color-grey-600);
  cursor: pointer;
  display: inline-flex;
  font-size: 1.6rem;
  font-weight: 500;
  gap: 0.75em;
  justify-content: center;
  min-height: 2.5em;
  padding: 0 0.75em;
  vertical-align: middle;

  &:not(.transparent) {
    box-shadow: var(--shadow-100);
  }

  &:hover {
    --button-accent-color: var(--color-context-primary-hover);
  }

  &:active,
  &.active {
    --button-accent-color: var(--color-context-primary-active);
  }

  &.busy {
    cursor: not-allowed;
  }

  &.disabled {
    --button-accent-color: var(--color-context-primary-disabled);
    cursor: not-allowed;
  }

  &.outlined {
    background-color: var(--color-context-tertiary);
    border-color: var(--button-accent-color);
    color: var(--button-accent-color);
  }

  &.transparent {
    background-color: transparent;
    color: var(--button-accent-color);
  }

  &.underlined {
    background-color: transparent;
    border-bottom: 0.1rem solid var(--button-accent-color);
    border-radius: 0;
    color: var(--button-accent-color);
  }
}

.icon {
  font-size: 0.8em;
}

.loader {
  align-items: center;
  animation: spin 1s infinite linear;
  background: conic-gradient(
    from 90deg at 50% 50%,
    rgba(255, 255, 255, 0) 0deg,
    rgba(255, 255, 255, 0) 0.04deg,
    var(--color-context-primary) 360deg
  );
  border-radius: 0.75em;
  display: inline-flex;
  height: 1.5em;
  justify-content: center;

  width: 1.5em;

  &::after {
    background-color: var(--color-context-secondary);
    border-radius: 0.6em;
    content: '';
    height: 1.2em;
    width: 1.2em;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
