<!-- v3 -->
<template>
  <!-- @TODO: Replace it by the VtsLabel component when update -->
  <label class="form-checkbox" v-bind="wrapperAttrs">
    <input
      v-model="value"
      :class="[classNames, { indeterminate: isIndeterminate }]"
      :disabled="isDisabled"
      type="checkbox"
      class="ui-checkbox"
      v-bind="attrs"
    />
    <span class="fake-checkbox">
      <VtsIcon :fixed-width="false" :icon class="icon" accent="brand" />
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
import { faCheck, faMinus } from '@fortawesome/free-solid-svg-icons'
import { computed, type HTMLAttributes, useAttrs } from 'vue'

type CheckboxAccent = 'brand' | 'success' | 'warning' | 'danger'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    accent: CheckboxAccent
    disabled?: boolean
    wrapperAttrs?: HTMLAttributes
  }>(),
  { disabled: undefined }
)

const value = defineModel<unknown>('modelValue')

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
const icon = computed(() => {
  if (value.value === undefined) {
    return faMinus
  }

  return faCheck
})

const attrs = useAttrs()

const isIndeterminate = computed(() => value.value === undefined)
</script>

<style lang="postcss" scoped>
.form-checkbox {
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
    box-shadow: var(--shadow-100);

    .icon {
      font-size: 0.75rem;
      position: absolute;
      color: var(--color-normal-txt-item);
      transition: opacity 0.125s ease-in-out;

      filter: drop-shadow(0 0.0625em 0.5em rgba(0, 0, 0, 0.1)) drop-shadow(0 0.1875em 0.1875em rgba(0, 0, 0, 0.06))
        drop-shadow(0 0.1875em 0.25em rgba(0, 0, 0, 0.08));
    }
  }

  .ui-checkbox {
    font-size: inherit;
    position: absolute;
    pointer-events: none;
    opacity: 0;

    &.indeterminate + .fake-checkbox > .icon {
      opacity: 1;
      color: var(--color-normal-txt-item);
    }

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

        &:checked + .fake-checkbox,
        &.indeterminate + .fake-checkbox {
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

        &:checked + .fake-checkbox,
        &.indeterminate + .fake-checkbox {
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

        &:checked + .fake-checkbox,
        &.indeterminate + .fake-checkbox {
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

        &:checked + .fake-checkbox,
        &.indeterminate + .fake-checkbox {
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

          &:hover {
            border-color: transparent;
            background-color: var(--color-normal-item-hover);
          }

          &:active {
            background-color: var(--color-normal-item-active);
          }
        }

        &.indeterminate:hover + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-normal-item-hover);
        }

        &:hover + .fake-checkbox {
          border-color: var(--color-normal-item-hover);
        }

        &:focus-visible + .fake-checkbox {
          outline: none;

          &::before {
            content: '';
            position: absolute;
            inset: -0.6rem;
            border: 0.2rem solid var(--color-normal-txt-base);
            border-radius: 0.4rem;
          }
        }

        &:active + .fake-checkbox {
          border-color: var(--color-normal-item-active);
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-normal-item-base);
        }

        &:checked:hover + .fake-checkbox {
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

          &:hover {
            border-color: transparent;
            background-color: var(--color-success-item-hover);
          }

          &:active {
            background-color: var(--color-success-item-active);
          }
        }

        &.indeterminate:hover + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-success-item-hover);
        }

        &:hover + .fake-checkbox {
          border-color: var(--color-success-item-hover);
        }

        &:focus-visible + .fake-checkbox {
          outline: none;

          &::before {
            content: '';
            position: absolute;
            inset: -0.6rem;
            border: 0.2rem solid var(--color-success-txt-base);
            border-radius: 0.4rem;
          }
        }

        &:active + .fake-checkbox {
          border-color: var(--color-success-item-active);
        }

        &:checked + .fake-checkbox {
          border-color: transparent;
          background-color: var(--color-success-item-base);
        }

        &:checked:hover + .fake-checkbox {
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

        &:focus-visible + .fake-checkbox {
          outline: none;

          &::before {
            content: '';
            position: absolute;
            inset: -0.6rem;
            border: 0.2rem solid var(--color-warning-txt-base);
            border-radius: 0.4rem;
          }
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

      &.accent--danger {
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

        &:focus-visible + .fake-checkbox {
          outline: none;

          &::before {
            content: '';
            position: absolute;
            inset: -0.6rem;
            border: 0.2rem solid var(--color-danger-txt-base);
            border-radius: 0.4rem;
          }
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
  }
}
</style>
