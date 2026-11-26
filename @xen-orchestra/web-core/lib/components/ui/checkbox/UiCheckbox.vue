<!-- v9 -->
<template>
  <div class="ui-checkbox">
    <label :class="classNames" class="checkbox-label" v-bind="wrapperAttrs">
      <input
        v-model="checkboxModel"
        :disabled="isDisabled"
        :indeterminate="isIndeterminate"
        :value
        class="input"
        type="checkbox"
        v-bind="attrs"
      />
      <span class="fake-checkbox">
        <VtsIcon :name="icon" size="medium" />
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
import { type CheckboxModel, useCheckboxState } from '@core/composables/checkbox-state.composable.ts'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, type LabelHTMLAttributes, useAttrs } from 'vue'

type CheckboxAccent = 'brand' | 'warning' | 'danger'

defineOptions({ inheritAttrs: false })

const { accent, value, disabled } = defineProps<{
  accent: CheckboxAccent
  value?: string
  disabled?: boolean
  wrapperAttrs?: LabelHTMLAttributes
}>()

const checkboxModel = defineModel<CheckboxModel>({ default: undefined })

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

const { isIndeterminate, icon } = useCheckboxState(checkboxModel, () => value)

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
      --checkbox-mark-color: var(--color-neutral-background-primary);
      position: relative;
      display: inline-flex;
      flex-shrink: 0;
      transition: color 0.125s ease-in-out;
    }

    .input {
      font-size: inherit;
      position: absolute;
      pointer-events: none;
      opacity: 0;

      &:focus-visible + .fake-checkbox {
        outline: none;

        &::before {
          content: '';
          position: absolute;
          inset: -0.5rem;
          border: 0.2rem solid var(--color-brand-txt-base);
          border-radius: 0.4rem;
        }
      }
    }

    &.accent--brand {
      .input:not(:disabled) {
        & + .fake-checkbox {
          color: var(--color-brand-txt-base);
        }

        &:hover + .fake-checkbox {
          color: var(--color-brand-txt-hover);
        }

        &:active + .fake-checkbox {
          color: var(--color-brand-txt-active);
        }
      }
    }

    &.accent--warning {
      .input:not(:disabled) {
        & + .fake-checkbox {
          color: var(--color-warning-txt-base);
        }

        &:hover + .fake-checkbox {
          color: var(--color-warning-txt-hover);
        }

        &:active + .fake-checkbox {
          color: var(--color-warning-txt-active);
        }
      }
    }

    &.accent--danger {
      .input:not(:disabled) {
        & + .fake-checkbox {
          color: var(--color-danger-txt-base);
        }

        &:hover + .fake-checkbox {
          color: var(--color-danger-txt-hover);
        }

        &:active + .fake-checkbox {
          color: var(--color-danger-txt-active);
        }
      }
    }

    &.disabled {
      color: var(--color-neutral-txt-secondary);
    }

    .input:disabled + .fake-checkbox {
      --checkbox-mark-color: var(--color-neutral-background-disabled);
      color: var(--color-neutral-txt-secondary);
      cursor: not-allowed;
    }
  }
}
</style>
