<!-- v5 -->
<template>
  <label :class="classNames" :style="checkboxStyle" class="ui-checkbox" v-bind="wrapperAttrs">
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
  <UiInfo v-if="slots.info" :accent="accent === 'brand' ? 'info' : accent">
    <slot name="info" />
  </UiInfo>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { toVariants } from '@core/utils/to-variants.util'
import { computed, type CSSProperties, type LabelHTMLAttributes, useAttrs } from 'vue'

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

const icon = computed(() => (isIndeterminate.value ? 'fa:minus' : 'fa:check'))

const checkboxStyle = computed<CSSProperties>(() => {
  return {
    '--checkbox-item-base': `var(--color-${accent}-item-base)`,
    '--checkbox-item-hover': `var(--color-${accent}-item-hover)`,
    '--checkbox-item-active': `var(--color-${accent}-item-active)`,
    '--checkbox-icon-color': `var(--color-neutral-background-primary)`,
  }
})

const attrs = useAttrs()
</script>

<style lang="postcss" scoped>
.ui-checkbox {
  --checkbox-item-base: var(--color-brand-item-base);
  --checkbox-item-hover: var(--color-brand-item-hover);
  --checkbox-item-active: var(--color-brand-item-active);
  --checkbox-icon-color: var(--color-neutral-background-primary);

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
    flex-shrink: 0;

    .icon {
      font-size: 0.75rem;
      color: var(--checkbox-icon-color);
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
      color: var(--checkbox-icon-color);
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

  .input:not(:disabled) {
    & + .fake-checkbox {
      border-color: var(--checkbox-item-base);
    }

    &.indeterminate + .fake-checkbox {
      background-color: var(--checkbox-item-base);

      &:hover {
        border-color: transparent;
        background-color: var(--checkbox-item-hover);
      }

      &:active {
        background-color: var(--checkbox-item-active);
      }
    }

    &.indeterminate:hover + .fake-checkbox {
      border-color: transparent;
      background-color: var(--checkbox-item-hover);
    }

    &:hover + .fake-checkbox {
      border-color: var(--checkbox-item-hover);
    }

    &:focus-visible + .fake-checkbox::before {
      border: 0.2rem solid var(--color-brand-txt-base);
    }

    &:active + .fake-checkbox {
      border-color: var(--checkbox-item-active);
    }

    &:checked + .fake-checkbox {
      border-color: transparent;
      background-color: var(--checkbox-item-base);
    }

    &:checked:hover + .fake-checkbox {
      background-color: var(--checkbox-item-hover);
    }

    &:checked:active + .fake-checkbox {
      background-color: var(--checkbox-item-active);
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
