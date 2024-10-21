<!-- v4 -->
<template>
  <button :class="classNames" :disabled="busy || isDisabled" class="vts-button" type="button">
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
import { toVariants } from '@core/utils/to-variants.util'
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

const classNames = computed(() => [
  fontClasses[props.size],
  toVariants({
    color: props.color,
    level: props.level,
    size: props.size,
    busy: props.busy,
    disabled: isDisabled.value,
  }),
])
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.vts-button {
  &.color--normal {
    &.level--primary {
      --vts-button--background-color: var(--color-normal-item-base);
      --vts-button--border-color: var(--color-normal-item-base);
      --vts-button--color: var(--color-normal-txt-item);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-normal-item-hover);
        --vts-button--border-color: var(--color-normal-item-hover);
        --vts-button--color: var(--color-normal-txt-item);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-normal-item-active);
        --vts-button--border-color: var(--color-normal-item-active);
        --vts-button--color: var(--color-normal-txt-item);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: var(--color-normal-item-disabled);
        --vts-button--border-color: var(--color-normal-item-disabled);
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-normal-item-base);
        --vts-button--border-color: var(--color-normal-item-base);
        --vts-button--color: var(--color-normal-txt-item);
      }
    }

    &.level--secondary {
      --vts-button--background-color: var(--color-neutral-background-primary);
      --vts-button--border-color: var(--color-normal-item-base);
      --vts-button--color: var(--color-normal-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-normal-item-hover);
        --vts-button--color: var(--color-normal-txt-hover);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-normal-item-active);
        --vts-button--color: var(--color-normal-txt-active);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: var(--color-neutral-background-disabled);
        --vts-button--border-color: var(--color-neutral-txt-secondary);
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-normal-item-base);
        --vts-button--color: var(--color-normal-txt-base);
      }
    }

    &.level--tertiary {
      &.color--normal {
        --vts-button--background-color: transparent;
        --vts-button--border-color: transparent;
        --vts-button--color: var(--color-normal-txt-base);

        &:is(:hover, .hover, :focus-visible) {
          --vts-button--background-color: var(--color-normal-background-hover);
          --vts-button--border-color: var(--color-normal-background-hover);
          --vts-button--color: var(--color-normal-txt-hover);
        }

        &:is(:active, .pressed) {
          --vts-button--background-color: var(--color-normal-background-active);
          --vts-button--border-color: var(--color-normal-background-active);
          --vts-button--color: var(--color-normal-txt-active);
        }

        &:is(:disabled, .disabled) {
          --vts-button--background-color: transparent;
          --vts-button--border-color: transparent;
          --vts-button--color: var(--color-neutral-txt-secondary);
        }

        &.busy {
          --vts-button--background-color: var(--color-normal-background-selected);
          --vts-button--border-color: var(--color-normal-background-selected);
          --vts-button--color: var(--color-normal-txt-base);
        }
      }
    }
  }

  &.color--success {
    &.level--primary {
      --vts-button--background-color: var(--color-success-item-base);
      --vts-button--border-color: var(--color-success-item-base);
      --vts-button--color: var(--color-success-txt-item);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-success-item-hover);
        --vts-button--border-color: var(--color-success-item-hover);
        --vts-button--color: var(--color-success-txt-item);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-success-item-active);
        --vts-button--border-color: var(--color-success-item-active);
        --vts-button--color: var(--color-success-txt-item);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: var(--color-success-item-disabled);
        --vts-button--border-color: var(--color-success-item-disabled);
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-success-item-base);
        --vts-button--border-color: var(--color-success-item-base);
        --vts-button--color: var(--color-success-txt-item);
      }
    }

    &.level--secondary {
      --vts-button--background-color: var(--color-neutral-background-primary);
      --vts-button--border-color: var(--color-success-txt-base);
      --vts-button--color: var(--color-success-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-success-txt-hover);
        --vts-button--color: var(--color-success-txt-hover);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-success-txt-active);
        --vts-button--color: var(--color-success-txt-active);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: var(--color-neutral-background-disabled);
        --vts-button--border-color: var(--color-neutral-txt-secondary);
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-success-txt-base);
        --vts-button--color: var(--color-success-txt-base);
      }
    }

    &.level--tertiary {
      --vts-button--background-color: transparent;
      --vts-button--border-color: transparent;
      --vts-button--color: var(--color-success-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-success-background-hover);
        --vts-button--border-color: var(--color-success-background-hover);
        --vts-button--color: var(--color-success-txt-hover);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-success-background-active);
        --vts-button--border-color: var(--color-success-background-active);
        --vts-button--color: var(--color-success-txt-active);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: transparent;
        --vts-button--border-color: transparent;
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-success-background-selected);
        --vts-button--border-color: var(--color-success-background-selected);
        --vts-button--color: var(--color-success-txt-base);
      }
    }
  }

  &.color--warning {
    &.level--primary {
      --vts-button--background-color: var(--color-warning-item-base);
      --vts-button--border-color: var(--color-warning-item-base);
      --vts-button--color: var(--color-warning-txt-item);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-warning-item-hover);
        --vts-button--border-color: var(--color-warning-item-hover);
        --vts-button--color: var(--color-warning-txt-item);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-warning-item-active);
        --vts-button--border-color: var(--color-warning-item-active);
        --vts-button--color: var(--color-warning-txt-item);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: var(--color-warning-item-disabled);
        --vts-button--border-color: var(--color-warning-item-disabled);
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-warning-item-base);
        --vts-button--border-color: var(--color-warning-item-base);
        --vts-button--color: var(--color-warning-txt-item);
      }
    }

    &.level--secondary {
      --vts-button--background-color: var(--color-neutral-background-primary);
      --vts-button--border-color: var(--color-warning-txt-base);
      --vts-button--color: var(--color-warning-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-warning-txt-hover);
        --vts-button--color: var(--color-warning-txt-hover);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-warning-txt-active);
        --vts-button--color: var(--color-warning-txt-active);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: var(--color-neutral-background-disabled);
        --vts-button--border-color: var(--color-neutral-txt-secondary);
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-warning-txt-base);
        --vts-button--color: var(--color-warning-txt-base);
      }
    }

    &.level--tertiary {
      --vts-button--background-color: transparent;
      --vts-button--border-color: transparent;
      --vts-button--color: var(--color-warning-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-warning-background-hover);
        --vts-button--border-color: var(--color-warning-background-hover);
        --vts-button--color: var(--color-warning-txt-hover);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-warning-background-active);
        --vts-button--border-color: var(--color-warning-background-active);
        --vts-button--color: var(--color-warning-txt-active);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: transparent;
        --vts-button--border-color: transparent;
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-warning-background-selected);
        --vts-button--border-color: var(--color-warning-background-selected);
        --vts-button--color: var(--color-warning-txt-base);
      }
    }
  }

  &.color--danger {
    &.level--primary {
      --vts-button--background-color: var(--color-danger-item-base);
      --vts-button--border-color: var(--color-danger-item-base);
      --vts-button--color: var(--color-danger-txt-item);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-danger-item-hover);
        --vts-button--border-color: var(--color-danger-item-hover);
        --vts-button--color: var(--color-danger-txt-item);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-danger-item-active);
        --vts-button--border-color: var(--color-danger-item-active);
        --vts-button--color: var(--color-danger-txt-item);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: var(--color-danger-item-disabled);
        --vts-button--border-color: var(--color-danger-item-disabled);
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-danger-item-base);
        --vts-button--border-color: var(--color-danger-item-base);
        --vts-button--color: var(--color-danger-txt-item);
      }
    }

    &.level--secondary {
      --vts-button--background-color: var(--color-neutral-background-primary);
      --vts-button--border-color: var(--color-danger-txt-base);
      --vts-button--color: var(--color-danger-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-danger-txt-hover);
        --vts-button--color: var(--color-danger-txt-hover);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-danger-txt-active);
        --vts-button--color: var(--color-danger-txt-active);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: var(--color-neutral-background-disabled);
        --vts-button--border-color: var(--color-neutral-txt-secondary);
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-neutral-background-primary);
        --vts-button--border-color: var(--color-danger-txt-base);
        --vts-button--color: var(--color-danger-txt-base);
      }
    }

    &.level--tertiary {
      --vts-button--background-color: transparent;
      --vts-button--border-color: transparent;
      --vts-button--color: var(--color-danger-txt-base);

      &:is(:hover, .hover, :focus-visible) {
        --vts-button--background-color: var(--color-danger-background-hover);
        --vts-button--border-color: var(--color-danger-background-hover);
        --vts-button--color: var(--color-danger-txt-hover);
      }

      &:is(:active, .pressed) {
        --vts-button--background-color: var(--color-danger-background-active);
        --vts-button--border-color: var(--color-danger-background-active);
        --vts-button--color: var(--color-danger-txt-active);
      }

      &:is(:disabled, .disabled) {
        --vts-button--background-color: transparent;
        --vts-button--border-color: transparent;
        --vts-button--color: var(--color-neutral-txt-secondary);
      }

      &.busy {
        --vts-button--background-color: var(--color-danger-background-selected);
        --vts-button--border-color: var(--color-danger-background-selected);
        --vts-button--color: var(--color-danger-txt-base);
      }
    }
  }
}

/* SIZE VARIANTS */
.vts-button {
  &.size--small {
    --vts-button--padding: 0.4rem 0.8rem;
    --vts-button--border-radius: 0.2rem;
  }

  &.size--medium {
    --vts-button--padding: 0.8rem 1.6rem;
    --vts-button--border-radius: 0.4rem;
  }

  &.size--large {
    --vts-button--padding: 1.6rem 2.4rem;
    --vts-button--border-radius: 0.8rem;
  }
}

/* IMPLEMENTATION */
.vts-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  vertical-align: middle;
  gap: 0.75em;
  border-width: 0.1rem;
  outline: none;
  border-color: var(--vts-button--border-color);
  border-radius: var(--vts-button--border-radius);
  border-style: solid;
  color: var(--vts-button--color);
  background-color: var(--vts-button--background-color);
  padding: var(--vts-button--padding);

  &.busy,
  &.disabled {
    cursor: not-allowed;
  }
}

.icon {
  font-size: 0.8em;
}
</style>
