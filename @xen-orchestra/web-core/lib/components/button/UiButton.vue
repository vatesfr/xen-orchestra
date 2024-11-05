<!-- v1.0 -->
<template>
  <button :class="className" :disabled="busy || isDisabled" class="ui-button" type="button">
    <VtsIcon :busy :icon="leftIcon" accent="current" class="icon" fixed-width />
    <slot />
    <VtsIcon :icon="rightIcon" accent="current" class="icon" fixed-width />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import type { ButtonLevel, ButtonSize } from '@core/types/button.type'
import type { Color } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    level: ButtonLevel
    color: Color
    size: ButtonSize
    busy?: boolean
    disabled?: boolean
    leftIcon?: IconDefinition
    rightIcon?: IconDefinition
  }>(),
  {
    disabled: undefined,
  }
)

const isDisabled = useContext(DisabledContext, () => props.disabled)

const fontClasses = {
  small: 'typo p3-medium',
  medium: 'typo h6-medium',
  large: 'typo h3-semi-bold',
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
  &.primary {
    &.normal {
      --background-color: var(--color-info-item-base);
      --border-color: var(--color-info-item-base);
      --color: var(--color-info-txt-item);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-info-item-hover);
        --border-color: var(--color-info-item-hover);
        --color: var(--color-info-txt-item);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-info-item-active);
        --border-color: var(--color-info-item-active);
        --color: var(--color-info-txt-item);
      }

      &:is(:disabled, .disabled) {
        --background-color: var(--color-info-item-disabled);
        --border-color: var(--color-info-item-disabled);
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-info-item-base);
        --border-color: var(--color-info-item-base);
        --color: var(--color-info-txt-item);
      }
    }

    &.success {
      --background-color: var(--color-success-item-base);
      --border-color: var(--color-success-item-base);
      --color: var(--color-success-txt-item);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-success-item-hover);
        --border-color: var(--color-success-item-hover);
        --color: var(--color-success-txt-item);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-success-item-active);
        --border-color: var(--color-success-item-active);
        --color: var(--color-success-txt-item);
      }

      &:is(:disabled, .disabled) {
        --background-color: var(--color-success-item-disabled);
        --border-color: var(--color-success-item-disabled);
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-success-item-base);
        --border-color: var(--color-success-item-base);
        --color: var(--color-success-txt-item);
      }
    }

    &.warning {
      --background-color: var(--color-warning-item-base);
      --border-color: var(--color-warning-item-base);
      --color: var(--color-warning-txt-item);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-warning-item-hover);
        --border-color: var(--color-warning-item-hover);
        --color: var(--color-warning-txt-item);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-warning-item-active);
        --border-color: var(--color-warning-item-active);
        --color: var(--color-warning-txt-item);
      }

      &:is(:disabled, .disabled) {
        --background-color: var(--color-warning-item-disabled);
        --border-color: var(--color-warning-item-disabled);
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-warning-item-base);
        --border-color: var(--color-warning-item-base);
        --color: var(--color-warning-txt-item);
      }
    }

    &.danger {
      --background-color: var(--color-danger-item-base);
      --border-color: var(--color-danger-item-base);
      --color: var(--color-danger-txt-item);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-danger-item-hover);
        --border-color: var(--color-danger-item-hover);
        --color: var(--color-danger-txt-item);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-danger-item-active);
        --border-color: var(--color-danger-item-active);
        --color: var(--color-danger-txt-item);
      }

      &:is(:disabled, .disabled) {
        --background-color: var(--color-danger-item-disabled);
        --border-color: var(--color-danger-item-disabled);
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-danger-item-base);
        --border-color: var(--color-danger-item-base);
        --color: var(--color-danger-txt-item);
      }
    }
  }

  &.secondary {
    &.normal {
      --background-color: var(--color-neutral-background-primary);
      --border-color: var(--color-info-item-base);
      --color: var(--color-info-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-info-item-hover);
        --color: var(--color-info-txt-hover);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-info-item-active);
        --color: var(--color-info-txt-active);
      }

      &:is(:disabled, .disabled) {
        --background-color: var(--color-neutral-background-disabled);
        --border-color: var(--color-neutral-txt-secondary);
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-info-item-base);
        --color: var(--color-info-txt-base);
      }
    }

    &.success {
      --background-color: var(--color-neutral-background-primary);
      --border-color: var(--color-success-txt-base);
      --color: var(--color-success-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-success-txt-hover);
        --color: var(--color-success-txt-hover);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-success-txt-active);
        --color: var(--color-success-txt-active);
      }

      &:is(:disabled, .disabled) {
        --background-color: var(--color-neutral-background-disabled);
        --border-color: var(--color-neutral-txt-secondary);
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-success-txt-base);
        --color: var(--color-success-txt-base);
      }
    }

    &.warning {
      --background-color: var(--color-neutral-background-primary);
      --border-color: var(--color-warning-txt-base);
      --color: var(--color-warning-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-warning-txt-hover);
        --color: var(--color-warning-txt-hover);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-warning-txt-active);
        --color: var(--color-warning-txt-active);
      }

      &:is(:disabled, .disabled) {
        --background-color: var(--color-neutral-background-disabled);
        --border-color: var(--color-neutral-txt-secondary);
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-warning-txt-base);
        --color: var(--color-warning-txt-base);
      }
    }

    &.danger {
      --background-color: var(--color-neutral-background-primary);
      --border-color: var(--color-danger-txt-base);
      --color: var(--color-danger-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-danger-txt-hover);
        --color: var(--color-danger-txt-hover);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-danger-txt-active);
        --color: var(--color-danger-txt-active);
      }

      &:is(:disabled, .disabled) {
        --background-color: var(--color-neutral-background-disabled);
        --border-color: var(--color-neutral-txt-secondary);
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-neutral-background-primary);
        --border-color: var(--color-danger-txt-base);
        --color: var(--color-danger-txt-base);
      }
    }
  }

  &.tertiary {
    &.normal {
      --background-color: transparent;
      --border-color: transparent;
      --color: var(--color-info-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-info-background-hover);
        --border-color: var(--color-info-background-hover);
        --color: var(--color-info-txt-hover);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-info-background-active);
        --border-color: var(--color-info-background-active);
        --color: var(--color-info-txt-active);
      }

      &:is(:disabled, .disabled) {
        --background-color: transparent;
        --border-color: transparent;
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-info-background-selected);
        --border-color: var(--color-info-background-selected);
        --color: var(--color-info-txt-base);
      }
    }

    &.success {
      --background-color: transparent;
      --border-color: transparent;
      --color: var(--color-success-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-success-background-hover);
        --border-color: var(--color-success-background-hover);
        --color: var(--color-success-txt-hover);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-success-background-active);
        --border-color: var(--color-success-background-active);
        --color: var(--color-success-txt-active);
      }

      &:is(:disabled, .disabled) {
        --background-color: transparent;
        --border-color: transparent;
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-success-background-selected);
        --border-color: var(--color-success-background-selected);
        --color: var(--color-success-txt-base);
      }
    }

    &.warning {
      --background-color: transparent;
      --border-color: transparent;
      --color: var(--color-warning-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-warning-background-hover);
        --border-color: var(--color-warning-background-hover);
        --color: var(--color-warning-txt-hover);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-warning-background-active);
        --border-color: var(--color-warning-background-active);
        --color: var(--color-warning-txt-active);
      }

      &:is(:disabled, .disabled) {
        --background-color: transparent;
        --border-color: transparent;
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-warning-background-selected);
        --border-color: var(--color-warning-background-selected);
        --color: var(--color-warning-txt-base);
      }
    }

    &.danger {
      --background-color: transparent;
      --border-color: transparent;
      --color: var(--color-danger-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --background-color: var(--color-danger-background-hover);
        --border-color: var(--color-danger-background-hover);
        --color: var(--color-danger-txt-hover);
      }

      &:is(:active, .pressed) {
        --background-color: var(--color-danger-background-active);
        --border-color: var(--color-danger-background-active);
        --color: var(--color-danger-txt-active);
      }

      &:is(:disabled, .disabled) {
        --background-color: transparent;
        --border-color: transparent;
        --color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --background-color: var(--color-danger-background-selected);
        --border-color: var(--color-danger-background-selected);
        --color: var(--color-danger-txt-base);
      }
    }
  }
}

/* SIZE VARIANTS */
.ui-button {
  &.small {
    --padding: 0.4rem 0.8rem;
    --border-radius: 0.2rem;
  }

  &.medium {
    --padding: 0.8rem 1.6rem;
    --border-radius: 0.4rem;
  }

  &.large {
    --padding: 1.6rem 2.4rem;
    --border-radius: 0.8rem;
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
  border-style: solid;
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
