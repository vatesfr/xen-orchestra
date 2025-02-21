<!-- v5 -->
<template>
  <label :class="classNames" class="ui-checkbox" v-bind="wrapperAttrs">
    <input
      v-model="checkboxModel"
      :class="{ indeterminate: isIndeterminate }"
      :disabled="isDisabled"
      class="input"
      type="checkbox"
      v-bind="attrs"
    />
    <span class="fake-checkbox">
      <VtsIcon :icon accent="current" class="icon" />
    </span>
    <span v-if="slots.default" class="typo p1-regular">
      <slot />
    </span>
  </label>
  <UiInfo v-if="slots.info" :accent="accent === 'brand' ? 'info' : accent">
    <slot name="info" />
  </UiInfo>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { toVariants } from '@core/utils/to-variants.util'
import { faCheck, faMinus } from '@fortawesome/free-solid-svg-icons'
import { computed, type LabelHTMLAttributes, useAttrs } from 'vue'

type CheckboxAccent = 'brand' | 'warning' | 'danger'

defineOptions({ inheritAttrs: false })

const { accent, disabled } = defineProps<{
  accent: CheckboxAccent
  disabled?: boolean
  wrapperAttrs?: LabelHTMLAttributes
}>()

const checkboxModel = defineModel<boolean | undefined | string[]>({ default: undefined })

const slots = defineSlots<{
  default?(): any
  info?(): any
}>()

const isDisabled = useDisabled(() => disabled)

const classNames = computed(() => [
  toVariants({
    accent,
    disabled: isDisabled.value,
  }),
])

const isIndeterminate = computed(() => checkboxModel.value === undefined)

const icon = computed(() => {
  if (isIndeterminate.value) {
    return faMinus
  }

  return faCheck
})

const attrs = useAttrs()
</script>

<style lang="postcss" scoped>
.ui-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;

  .fake-checkbox {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 1.6rem;
    width: 1.6rem;
    transition:
      background-color 0.125s ease-in-out,
      border-color 0.125s ease-in-out;
    border: 0.2rem solid transparent;
    border-radius: 0.2rem;

    .icon {
      font-size: 0.75rem;
      position: absolute;
      color: var(--color-info-txt-item);
      transition: opacity 0.125s ease-in-out;
    }
  }

  .input {
    font-size: inherit;
    position: absolute;
    pointer-events: none;
    opacity: 0;

    &.indeterminate + .fake-checkbox > .icon {
      opacity: 1;
      color: var(--color-info-txt-item);
    }

    & + .fake-checkbox > .icon {
      opacity: 0;
    }

    &:checked + .fake-checkbox > .icon {
      opacity: 1;
    }

    &:focus-visible + .fake-checkbox {
      outline: none;

      &::before {
        content: '';
        position: absolute;
        inset: -0.5rem;
        border-radius: 0.4rem;
        border-width: 0.2rem;
        border-style: solid;
      }
    }
  }

  &.accent--brand {
    .input:not(:disabled) {
      & + .fake-checkbox {
        border-color: var(--color-brand-item-base);
      }

      &.indeterminate + .fake-checkbox {
        background-color: var(--color-brand-item-base);

        &:hover {
          border-color: transparent;
          background-color: var(--color-brand-item-hover);
        }

        &:active {
          background-color: var(--color-brand-item-active);
        }
      }

      &.indeterminate:hover + .fake-checkbox {
        border-color: transparent;
        background-color: var(--color-brand-item-hover);
      }

      &:hover + .fake-checkbox {
        border-color: var(--color-brand-item-hover);
      }

      &:focus-visible + .fake-checkbox::before {
        border: 0.2rem solid var(--color-brand-txt-base);
      }

      &:active + .fake-checkbox {
        border-color: var(--color-brand-item-active);
      }

      &:checked + .fake-checkbox {
        border-color: transparent;
        background-color: var(--color-brand-item-base);
      }

      &:checked:hover + .fake-checkbox {
        background-color: var(--color-brand-item-hover);
      }

      &:checked:active + .fake-checkbox {
        background-color: var(--color-brand-item-active);
      }
    }
  }

  &.accent--warning {
    .input:not(:disabled) {
      & + .fake-checkbox {
        border-color: var(--color-warning-item-base);
      }

      &.indeterminate + .fake-checkbox {
        background-color: var(--color-warning-item-base);

        &:hover {
          border-color: transparent;
          background-color: var(--color-warning-item-hover);
        }

        &:active {
          background-color: var(--color-warning-item-active);
        }
      }

      &.indeterminate:hover + .fake-checkbox {
        border-color: transparent;
        background-color: var(--color-warning-item-hover);
      }

      &:hover + .fake-checkbox {
        border-color: var(--color-warning-item-hover);
      }

      &:focus-visible + .fake-checkbox::before {
        border: 0.2rem solid var(--color-brand-txt-base);
      }

      &:active + .fake-checkbox {
        border-color: var(--color-warning-item-active);
      }

      &:checked + .fake-checkbox {
        border-color: transparent;
        background-color: var(--color-warning-item-base);
      }

      &:checked:hover + .fake-checkbox {
        background-color: var(--color-warning-item-hover);
      }

      &:checked:active + .fake-checkbox {
        background-color: var(--color-warning-item-active);
      }
    }
  }

  &.accent--danger {
    .input:not(:disabled) {
      & + .fake-checkbox {
        border-color: var(--color-danger-item-base);

        > .icon {
          color: var(--color-danger-txt-item);
        }
      }

      &.indeterminate + .fake-checkbox {
        background-color: var(--color-danger-item-base);

        &:hover {
          border-color: transparent;
          background-color: var(--color-danger-item-hover);
        }

        &:active {
          background-color: var(--color-danger-item-active);
        }
      }

      &.indeterminate:hover + .fake-checkbox {
        border-color: transparent;
        background-color: var(--color-danger-item-hover);
      }

      &:hover + .fake-checkbox {
        border-color: var(--color-danger-item-hover);
      }

      &:focus-visible + .fake-checkbox::before {
        border: 0.2rem solid var(--color-brand-txt-base);
      }

      &:active + .fake-checkbox {
        border-color: var(--color-danger-item-active);
      }

      &:checked + .fake-checkbox {
        border-color: transparent;
        background-color: var(--color-danger-item-base);
      }

      &:checked:hover + .fake-checkbox {
        background-color: var(--color-danger-item-hover);
      }

      &:checked:active + .fake-checkbox {
        background-color: var(--color-danger-item-active);
      }
    }
  }

  .input:disabled {
    & + .fake-checkbox {
      cursor: not-allowed;
      border-color: var(--color-neutral-txt-secondary);

      > .icon {
        color: var(--color-neutral-background-disabled);
      }
    }

    &:checked + .fake-checkbox,
    &.indeterminate + .fake-checkbox {
      border-color: transparent;
      background-color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
