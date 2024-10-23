<!-- v4 -->
<template>
  <!-- @TODO: Replace it by the UiLabel component when update -->
  <label class="form-radio-button" v-bind="wrapperAttrs">
    <input
      v-model="model"
      :value="value"
      :class="classNames"
      :disabled="isDisabled"
      type="radio"
      class="radio-button"
      v-bind="$attrs"
    />
    <span class="fake-checkbox">
      <VtsIcon :fixed-width="false" :icon="faCircle" class="icon" accent="brand" />
    </span>
    <span v-if="slots.default" class="typo p1-regular">
      <slot />
    </span>
  </label>
  <VtsInfo v-if="slots.info" :accent>
    <slot name="info" />
  </VtsInfo>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInfo from '@core/components/info/VtsInfo.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { toVariants } from '@core/utils/to-variants.util'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { computed, type HTMLAttributes } from 'vue'

export type RadioButtonAccent = 'brand' | 'success' | 'warning' | 'danger'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    value: string
    accent: RadioButtonAccent
    disabled?: boolean
    wrapperAttrs?: HTMLAttributes
  }>(),
  { disabled: undefined }
)
const model = defineModel<string>('modelValue', { required: true })

const slots = defineSlots<{
  default?(): any
  info?(): any
}>()

const isDisabled = useContext(DisabledContext, () => props.disabled)

const classNames = computed(() => [
  toVariants({
    accent: props.accent,
    disabled: isDisabled.value,
  }),
])
</script>

<style lang="postcss" scoped>
.form-radio-button {
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
    border-radius: 1rem;
    background-color: var(--color-neutral-background-primary);
    box-shadow: var(--shadow-100);
  }

  .icon {
    transition: opacity 0.125s ease-in-out;
    font-size: 0.75rem;
    position: absolute;
    color: var(--color-normal-txt-item);
  }

  .radio-button {
    font-size: inherit;
    position: absolute;
    pointer-events: none;
    opacity: 0;

    & + .fake-checkbox > .icon {
      opacity: 0;
    }

    &:checked + .fake-checkbox > .icon {
      opacity: 1;
    }

    &:disabled {
      &.accent--brand {
        & + .fake-checkbox {
          cursor: not-allowed;
          border-color: var(--color-neutral-txt-secondary);

          > .icon {
            color: var(--color-neutral-txt-secondary);
          }
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-normal-item-disabled);
        }
      }

      &.accent--success {
        & + .fake-checkbox {
          cursor: not-allowed;
          border-color: var(--color-neutral-txt-secondary);

          > .icon {
            color: var(--color-neutral-txt-secondary);
          }
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-success-item-disabled);
        }
      }

      &.accent--warning {
        & + .fake-checkbox {
          cursor: not-allowed;
          border-color: var(--color-neutral-txt-secondary);

          > .icon {
            color: var(--color-neutral-txt-secondary);
          }
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-warning-item-disabled);
        }
      }

      &.accent--danger {
        & + .fake-checkbox {
          cursor: not-allowed;
          border-color: var(--color-neutral-txt-secondary);

          > .icon {
            color: var(--color-neutral-txt-secondary);
          }
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-danger-item-disabled);
        }
      }
    }

    &:not(:disabled) {
      &.accent--brand {
        & + .fake-checkbox {
          border-color: var(--color-normal-item-base);
        }

        &.indeterminate + .fake-checkbox {
          background-color: var(--color-normal-item-base);

          &:hover,
          &:focus {
            border-color: transparent;
            background-color: var(--color-normal-item-hover);
          }

          &:active {
            background-color: var(--color-normal-item-active);
          }
        }

        &:hover + .fake-checkbox,
        &:focus + .fake-checkbox {
          border-color: var(--color-normal-item-hover);
        }

        &:active + .fake-checkbox {
          border-color: var(--color-normal-item-active);
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-normal-item-base);
        }

        &:checked:hover + .fake-checkbox,
        &:checked:focus + .fake-checkbox {
          background-color: var(--color-normal-item-hover);
        }

        &:checked:active + .fake-checkbox {
          background-color: var(--color-normal-item-active);
        }
      }

      &.accent--success {
        & + .fake-checkbox {
          border-color: var(--color-success-item-base);
        }

        &.indeterminate + .fake-checkbox {
          background-color: var(--color-success-item-base);

          &:hover,
          &:focus {
            border-color: transparent;
            background-color: var(--color-success-item-hover);
          }

          &:active {
            background-color: var(--color-success-item-active);
          }
        }

        &:hover + .fake-checkbox,
        &:focus + .fake-checkbox {
          border-color: var(--color-success-item-hover);
        }

        &:active + .fake-checkbox {
          border-color: var(--color-success-item-active);
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-success-item-base);
        }

        &:checked:hover + .fake-checkbox,
        &:checked:focus + .fake-checkbox {
          background-color: var(--color-success-item-hover);
        }

        &:checked:active + .fake-checkbox {
          background-color: var(--color-success-item-active);
        }
      }

      &.accent--warning {
        & + .fake-checkbox {
          border-color: var(--color-warning-item-base);
        }

        &.indeterminate + .fake-checkbox {
          background-color: var(--color-warning-item-base);

          &:hover,
          &:focus {
            border-color: transparent;
            background-color: var(--color-warning-item-hover);
          }

          &:active {
            background-color: var(--color-warning-item-active);
          }
        }

        &:hover + .fake-checkbox,
        &:focus + .fake-checkbox {
          border-color: var(--color-warning-item-hover);
        }

        &:active + .fake-checkbox {
          border-color: var(--color-warning-item-active);
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-warning-item-base);
        }

        &:checked:hover + .fake-checkbox,
        &:checked:focus + .fake-checkbox {
          background-color: var(--color-warning-item-hover);
        }

        &:checked:active + .fake-checkbox {
          background-color: var(--color-warning-item-active);
        }
      }

      &.accent--danger {
        & + .fake-checkbox {
          border-color: var(--color-danger-item-base);

          > .icon {
            color: var(--color-danger-txt-item);
          }
        }

        &.indeterminate + .fake-checkbox {
          background-color: var(--color-danger-item-base);

          &:hover,
          &:focus {
            border-color: transparent;
            background-color: var(--color-danger-item-hover);
          }

          &:active {
            background-color: var(--color-danger-item-active);
          }
        }

        &:hover + .fake-checkbox,
        &:focus + .fake-checkbox {
          border-color: var(--color-danger-item-hover);
        }

        &:active + .fake-checkbox {
          border-color: var(--color-danger-item-active);
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-danger-item-base);
        }

        &:checked:hover + .fake-checkbox,
        &:checked:focus + .fake-checkbox {
          background-color: var(--color-danger-item-hover);
        }

        &:checked:active + .fake-checkbox {
          background-color: var(--color-danger-item-active);
        }
      }
    }
  }
}
</style>
