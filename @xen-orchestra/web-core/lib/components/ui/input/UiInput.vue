<!-- v5 -->
<template>
  <div :class="toVariants({ accent, disabled })" class="ui-input" @click.self="focus()">
    <VtsIcon :icon accent="current" class="left-icon" />
    <input
      :id="wrapperController?.id ?? id"
      ref="inputRef"
      v-model.trim="modelValue"
      :disabled
      :required
      :type
      class="typo-body-regular input text-ellipsis"
      v-bind="attrs"
    />
    <VtsIcon
      v-if="!disabled && modelValue && clearable"
      :icon="faXmark"
      accent="brand"
      class="clear-icon"
      @click="clear()"
    />
    <slot v-if="slots.rightIcon || rightIcon" name="rightIcon">
      <VtsIcon :icon="rightIcon" accent="current" class="right-icon" />
    </slot>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { LabelAccent } from '@core/components/ui/label/UiLabel.vue'
import { useMapper } from '@core/composables/mapper.composable.ts'
import { IK_INPUT_WRAPPER_CONTROLLER } from '@core/utils/injection-keys.util'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { inject, ref, useAttrs, watchEffect } from 'vue'

type InputAccent = 'brand' | 'warning' | 'danger'
type InputType = 'text' | 'number' | 'password' | 'search'

defineOptions({
  inheritAttrs: false,
})

const {
  accent: _accent,
  required,
  disabled,
  id,
} = defineProps<{
  accent: InputAccent
  id?: string
  required?: boolean
  disabled?: boolean
  type?: InputType
  icon?: IconDefinition
  rightIcon?: IconDefinition
  clearable?: boolean
}>()

const modelValue = defineModel<string | number>({ required: true })

const slots = defineSlots<{
  rightIcon?(): any
}>()

const attrs = useAttrs()

const inputRef = ref<HTMLInputElement>()

const wrapperController = inject(IK_INPUT_WRAPPER_CONTROLLER, undefined)

const accent = useMapper<LabelAccent, InputAccent>(
  () => wrapperController?.labelAccent,
  {
    neutral: _accent,
    warning: 'warning',
    danger: 'danger',
  },
  () => _accent
)

if (wrapperController) {
  watchEffect(() => {
    wrapperController.required = required
  })
}

function focus() {
  inputRef.value?.focus()
}

function clear() {
  modelValue.value = ''
  focus()
}

defineExpose({ focus })
</script>

<style lang="postcss" scoped>
.ui-input {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  border-radius: 0.4rem;
  border-width: 0.1rem;
  border-style: solid;
  background-color: var(--color-neutral-background-primary);
  color: var(--color-neutral-txt-primary);
  height: 4rem;
  outline: none;
  width: 100%;
  padding-inline: 1.6rem;

  .left-icon,
  .right-icon {
    pointer-events: none;
    color: var(--color-neutral-txt-secondary);
  }

  &:not(.disabled) .right-icon {
    color: var(--color-brand-item-base);
  }

  .input {
    background-color: transparent;
    border: none;
    outline: none;
    flex: 1;

    &::placeholder {
      color: var(--color-neutral-txt-secondary);
    }
  }

  /* VARIANT */

  &.accent--brand {
    border-color: var(--color-neutral-border);

    &:focus-within {
      border-color: var(--color-brand-item-base);
    }

    &:hover {
      border-color: var(--color-brand-item-hover);
    }

    &:has(input:active) {
      border-color: var(--color-brand-item-active);
    }

    &:has(input:disabled) {
      border-color: var(--color-neutral-border);
      background-color: var(--color-neutral-background-disabled);
    }
  }

  &.accent--warning {
    border-color: var(--color-warning-item-base);

    &:hover {
      border-color: var(--color-warning-item-hover);
    }

    &:has(input:active) {
      border-color: var(--color-warning-item-active);
    }

    &:has(input:disabled) {
      border-color: var(--color-neutral-border);
      background-color: var(--color-neutral-background-disabled);
    }
  }

  &.accent--danger {
    border-color: var(--color-danger-item-base);

    &:hover {
      border-color: var(--color-danger-item-hover);
    }

    &:has(input:active) {
      border-color: var(--color-danger-item-active);
    }

    &:has(input:disabled) {
      border-color: var(--color-neutral-border);
      background-color: var(--color-neutral-background-disabled);
    }
  }
}
</style>
