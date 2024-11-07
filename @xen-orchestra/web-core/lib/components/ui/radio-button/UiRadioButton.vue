<!-- v4 -->
<template>
  <label class="ui-radio-button" :class="classNames" v-bind="wrapperAttrs">
    <input v-model="radioModel" :value="value" :disabled="isDisabled" type="radio" class="input" v-bind="attrs" />
    <span class="fake-radio">
      <VtsIcon :icon="faCircle" class="icon" accent="info" />
    </span>
    <span v-if="slots.default" class="typo p1-regular">
      <slot />
    </span>
  </label>
  <UiInfo v-if="slots.info" :accent>
    <slot name="info" />
  </UiInfo>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { toVariants } from '@core/utils/to-variants.util'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { computed, type LabelHTMLAttributes, useAttrs } from 'vue'

export type RadioButtonAccent = 'info' | 'success' | 'warning' | 'danger'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    value: string
    accent: RadioButtonAccent
    disabled?: boolean
    wrapperAttrs?: LabelHTMLAttributes
  }>(),
  { disabled: undefined }
)
const radioModel = defineModel<string>({ required: true })

const slots = defineSlots<{
  default?(): any
  info?(): any
}>()

const attrs = useAttrs()

const isDisabled = useContext(DisabledContext, () => props.disabled)

const classNames = computed(() => [
  toVariants({
    accent: props.accent,
    disabled: isDisabled.value,
  }),
])
</script>

<style lang="postcss" scoped>
.ui-radio-button {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;

  .input {
    font-size: inherit;
    position: absolute;
    pointer-events: none;
    opacity: 0;

    & + .fake-radio > .icon {
      opacity: 0;
    }

    &:checked + .fake-radio > .icon {
      opacity: 1;
    }

    &:focus-visible + .fake-radio {
      outline: none;

      &::before {
        content: '';
        position: absolute;
        inset: -0.6rem;
        border-radius: 0.4rem;
      }
    }
  }

  &.accent--info {
    .input {
      & + .fake-radio {
        border-color: var(--color-info-item-base);
      }

      &:hover + .fake-radio {
        border-color: var(--color-info-item-hover);
      }

      &:focus-visible + .fake-radio::before {
        border: 0.2rem solid var(--color-info-txt-base);
      }

      &:active + .fake-radio {
        border-color: var(--color-info-item-active);
      }

      &:checked + .fake-radio {
        border-color: transparent;
        background-color: var(--color-info-item-base);
      }

      &:checked:hover + .fake-radio {
        background-color: var(--color-info-item-hover);
      }

      &:checked:active + .fake-radio {
        background-color: var(--color-info-item-active);
      }

      &:disabled {
        & + .fake-radio {
          cursor: not-allowed;
          border-color: var(--color-neutral-txt-secondary);

          > .icon {
            color: var(--color-neutral-txt-secondary);
          }
        }

        &:checked + .fake-radio {
          border-color: transparent;
          background-color: var(--color-info-item-disabled);
        }
      }
    }
  }

  &.accent--success {
    .input {
      & + .fake-radio {
        border-color: var(--color-success-item-base);
      }

      &:hover + .fake-radio {
        border-color: var(--color-success-item-hover);
      }

      &:focus-visible + .fake-radio::before {
        border: 0.2rem solid var(--color-success-txt-base);
      }

      &:active + .fake-radio {
        border-color: var(--color-success-item-active);
      }

      &:checked + .fake-radio {
        border-color: transparent;
        background-color: var(--color-success-item-base);
      }

      &:checked:hover + .fake-radio {
        background-color: var(--color-success-item-hover);
      }

      &:checked:active + .fake-radio {
        background-color: var(--color-success-item-active);
      }

      &:disabled {
        & + .fake-radio {
          cursor: not-allowed;
          border-color: var(--color-neutral-txt-secondary);

          > .icon {
            color: var(--color-neutral-txt-secondary);
          }
        }

        &:checked + .fake-radio {
          border-color: transparent;
          background-color: var(--color-success-item-disabled);
        }
      }
    }
  }

  &.accent--warning {
    .input {
      & + .fake-radio {
        border-color: var(--color-warning-item-base);
      }

      &:hover + .fake-radio {
        border-color: var(--color-warning-item-hover);
      }

      &:focus-visible + .fake-radio::before {
        border: 0.2rem solid var(--color-warning-txt-base);
      }

      &:active + .fake-radio {
        border-color: var(--color-warning-item-active);
      }

      &:checked + .fake-radio {
        border-color: transparent;
        background-color: var(--color-warning-item-base);
      }

      &:checked:hover + .fake-radio {
        background-color: var(--color-warning-item-hover);
      }

      &:checked:active + .fake-radio {
        background-color: var(--color-warning-item-active);
      }

      &:disabled {
        & + .fake-radio {
          cursor: not-allowed;
          border-color: var(--color-neutral-txt-secondary);

          > .icon {
            color: var(--color-neutral-txt-secondary);
          }
        }

        &:checked + .fake-radio {
          border-color: transparent;
          background-color: var(--color-warning-item-disabled);
        }
      }
    }
  }

  &.accent--danger {
    .input {
      & + .fake-radio {
        border-color: var(--color-danger-item-base);

        > .icon {
          color: var(--color-danger-txt-item);
        }
      }

      &:hover + .fake-radio {
        border-color: var(--color-danger-item-hover);
      }

      &:focus-visible + .fake-radio::before {
        border: 0.2rem solid var(--color-danger-txt-base);
      }

      &:active + .fake-radio {
        border-color: var(--color-danger-item-active);
      }

      &:checked + .fake-radio {
        border-color: transparent;
        background-color: var(--color-danger-item-base);
      }

      &:checked:hover + .fake-radio {
        background-color: var(--color-danger-item-hover);
      }

      &:checked:active + .fake-radio {
        background-color: var(--color-danger-item-active);
      }

      &:disabled {
        & + .fake-radio {
          cursor: not-allowed;
          border-color: var(--color-neutral-txt-secondary);

          > .icon {
            color: var(--color-neutral-txt-secondary);
          }
        }

        &:checked + .fake-radio {
          border-color: transparent;
          background-color: var(--color-danger-item-disabled);
        }
      }
    }
  }

  .fake-radio {
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

    .icon {
      transition: opacity 0.125s ease-in-out;
      font-size: 0.75rem;
      position: absolute;
      color: var(--color-info-txt-item);
    }
  }
}
</style>
