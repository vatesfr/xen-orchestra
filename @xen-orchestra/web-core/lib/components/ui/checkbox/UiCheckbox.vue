<!-- v8 -->
<template>
  <div class="ui-checkbox">
    <label :class="classNames" class="checkbox-label" v-bind="wrapperAttrs">
      <input
        v-model="checkboxModel"
        :class="{ indeterminate: isIndeterminate }"
        :disabled="isDisabled"
        class="input"
        type="checkbox"
        v-bind="attrs"
      />
      <span class="fake-checkbox">
        <VtsIcon :name="icon" size="medium" class="icon" />
      </span>
      <span v-if="slots.default" class="typo-body-regular">
        <slot />
      </span>
    </label>
    <UiInfo v-if="slots.info" accent="info">
      <slot name="info" />
    </UiInfo>
    <UiInfo v-if="slots.message && accent !== 'brand'" :accent>
      <slot name="message" />
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { toVariants } from '@core/utils/to-variants.util'
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
  message?(): any
}>()

const isDisabled = useDisabled(() => disabled)

const classNames = computed(() => [
  toVariants({
    accent,
    disabled: isDisabled.value,
  }),
])

const isIndeterminate = computed(() => checkboxModel.value === undefined)

const icon = computed(() => (isIndeterminate.value ? 'fa:minus' : 'fa:check'))

const attrs = useAttrs()
</script>

<style lang="postcss" scoped>
.ui-checkbox {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;

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
      flex-shrink: 0;

      .icon {
        font-size: 0.75rem;
        color: var(--color-neutral-background-primary);
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
        color: var(--color-neutral-background-primary);
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
          border-color: var(--color-brand-txt-base);
        }

        &.indeterminate + .fake-checkbox {
          background-color: var(--color-brand-txt-base);

          &:hover {
            border-color: transparent;
            background-color: var(--color-brand-txt-hover);
          }

          &:active {
            background-color: var(--color-brand-txt-active);
          }
        }

        &.indeterminate:hover + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-brand-txt-hover);
        }

        &:hover + .fake-checkbox {
          border-color: var(--color-brand-txt-hover);
        }

        &:focus-visible + .fake-checkbox::before {
          border: 0.2rem solid var(--color-brand-txt-base);
        }

        &:active + .fake-checkbox {
          border-color: var(--color-brand-txt-active);
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-brand-txt-base);
        }

        &:checked:hover + .fake-checkbox {
          background-color: var(--color-brand-txt-hover);
        }

        &:checked:active + .fake-checkbox {
          background-color: var(--color-brand-txt-active);
        }
      }
    }

    &.accent--warning {
      .input:not(:disabled) {
        & + .fake-checkbox {
          border-color: var(--color-warning-txt-base);
        }

        &.indeterminate + .fake-checkbox {
          background-color: var(--color-warning-txt-base);

          &:hover {
            border-color: transparent;
            background-color: var(--color-warning-txt-hover);
          }

          &:active {
            background-color: var(--color-warning-txt-active);
          }
        }

        &.indeterminate:hover + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-warning-txt-hover);
        }

        &:hover + .fake-checkbox {
          border-color: var(--color-warning-txt-hover);
        }

        &:focus-visible + .fake-checkbox::before {
          border: 0.2rem solid var(--color-brand-txt-base);
        }

        &:active + .fake-checkbox {
          border-color: var(--color-warning-txt-active);
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-warning-txt-base);
        }

        &:checked:hover + .fake-checkbox {
          background-color: var(--color-warning-txt-hover);
        }

        &:checked:active + .fake-checkbox {
          background-color: var(--color-warning-txt-active);
        }
      }
    }

    &.accent--danger {
      .input:not(:disabled) {
        & + .fake-checkbox {
          border-color: var(--color-danger-txt-base);

          > .icon {
            color: var(--color-danger-txt-item);
          }
        }

        &.indeterminate + .fake-checkbox {
          background-color: var(--color-danger-txt-base);

          &:hover {
            border-color: transparent;
            background-color: var(--color-danger-txt-hover);
          }

          &:active {
            background-color: var(--color-danger-txt-active);
          }
        }

        &.indeterminate:hover + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-danger-txt-hover);
        }

        &:hover + .fake-checkbox {
          border-color: var(--color-danger-txt-hover);
        }

        &:focus-visible + .fake-checkbox::before {
          border: 0.2rem solid var(--color-brand-txt-base);
        }

        &:active + .fake-checkbox {
          border-color: var(--color-danger-txt-active);
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-danger-txt-base);
        }

        &:checked:hover + .fake-checkbox {
          background-color: var(--color-danger-txt-hover);
        }

        &:checked:active + .fake-checkbox {
          background-color: var(--color-danger-txt-active);
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
}
</style>
