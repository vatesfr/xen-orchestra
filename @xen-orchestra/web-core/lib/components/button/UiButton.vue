<!-- v1.0 -->
<template>
  <button :class="className" :disabled="busy || isDisabled" class="ui-button" type="button">
    <UiIcon :busy :icon="leftIcon" class="icon" fixed-width />
    <slot />
    <UiIcon :icon="rightIcon" class="icon" fixed-width />
  </button>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import type { ButtonLevel, ButtonSize } from '@core/types/button.type'
import type { Color } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    level?: ButtonLevel
    busy?: boolean
    disabled?: boolean
    leftIcon?: IconDefinition
    rightIcon?: IconDefinition
    color?: Color
    size?: ButtonSize
  }>(),
  {
    disabled: undefined,
    color: 'info',
    level: 'primary',
    size: 'small',
  }
)

const isDisabled = useContext(DisabledContext, () => props.disabled)

const fontClasses = {
  'extra-small': 'typo p3-medium',
  small: 'typo h6-medium',
  medium: 'typo h3-semi-bold',
}

const className = computed(() => {
  return [
    props.color,
    props.level,
    props.size,
    fontClasses[props.size],
    {
      busy: props.busy,
      disabled: isDisabled.value,
    },
  ]
})
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.ui-button {
  &.info {
    --accent-color: var(--color-purple-base);

    &:is(:hover, .hover, :focus-visible) {
      --accent-color: var(--color-purple-d20);
    }

    &:is(:active, .pressed) {
      --accent-color: var(--color-purple-d40);
    }

    &:is(:disabled, .disabled) {
      --accent-color: var(--color-grey-400);
    }
  }

  &.success {
    --accent-color: var(--color-green-base);

    &:is(:hover, .hover, :focus-visible) {
      --accent-color: var(--color-green-d20);
    }

    &:is(:active, .pressed) {
      --accent-color: var(--color-green-d40);
    }

    &:is(:disabled, .disabled) {
      --accent-color: var(--color-green-l60);
    }
  }

  &.warning {
    --accent-color: var(--color-orange-base);

    &:is(:hover, .hover, :focus-visible) {
      --accent-color: var(--color-orange-d20);
    }

    &:is(:active, .pressed) {
      --accent-color: var(--color-orange-d40);
    }

    &:is(:disabled, .disabled) {
      --accent-color: var(--color-orange-l60);
    }
  }

  &:is(.danger, .error) {
    --accent-color: var(--color-red-base);

    &:is(:hover, .hover, :focus-visible) {
      --accent-color: var(--color-red-d20);
    }

    &:is(:active, .pressed) {
      --accent-color: var(--color-red-d40);
    }

    &:is(:disabled, .disabled) {
      --accent-color: var(--color-red-l60);
    }
  }
}

/* SIZE VARIANTS */
.ui-button {
  &.extra-small {
    --padding: 0.4rem 0.8rem;

    &.tertiary {
      --padding: 0;
    }
  }

  &.small {
    --padding: 0.8rem 1.6rem;

    &.tertiary {
      --padding: 0.2rem 0;
    }
  }

  &.medium {
    --padding: 1.6rem 2.4rem;

    &.tertiary {
      --padding: 0.4rem 0;
    }
  }
}

/* LEVELS VARIANTS */
.ui-button {
  &.primary {
    --color: var(--color-grey-600);
    --background-color: var(--accent-color);
    --border-color: var(--accent-color);
    --border-style: solid;
    --border-radius: 0.8rem;
  }

  &.secondary {
    --color: var(--accent-color);
    --background-color: var(--background-color-primary);
    --border-color: var(--accent-color);
    --border-style: solid;
    --border-radius: 0.8rem;
  }

  &.tertiary {
    --color: var(--accent-color);
    --background-color: transparent;
    --border-color: var(--accent-color);
    --border-style: none none solid;
    --border-radius: 0;
  }
}

/* IMPLEMENTATION */
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  vertical-align: middle;
  gap: 0.75em;
  border-width: 0.1rem;
  outline: none;
  border-color: var(--border-color);
  border-radius: var(--border-radius);
  border-style: var(--border-style);
  color: var(--color);
  background-color: var(--background-color);
  padding: var(--padding);

  &.busy,
  &.disabled {
    cursor: not-allowed;
  }
}

.icon {
  font-size: 0.8em;
}
</style>
