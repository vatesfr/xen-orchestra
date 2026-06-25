<!-- v9 -->
<template>
  <div :class="toVariants({ accent, disabled, selected: isSelected })" class="ui-input" @click.self="focus()">
    <span v-if="slots.prefix || prefix" class="prefix">
      <slot name="prefix">
        {{ prefix }}
      </slot>
    </span>
    <span v-if="readonly" class="typo-body-regular input text-ellipsis">
      <input ref="inputRef" class="readonly-input" readonly type="text" />
      {{ modelValue }}
    </span>
    <input
      v-else
      :id="wrapperController?.id ?? id"
      ref="inputRef"
      :value="modelValue"
      :disabled
      :required
      :type
      class="typo-body-regular input text-ellipsis"
      v-bind="attrs"
      @input="event => handleInput(event)"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
    <span v-if="slots.suffix || suffix" class="suffix">
      <slot name="suffix">
        {{ suffix }}
      </slot>
    </span>
    <UiButtonIcon
      v-if="!disabled && modelValue && clearable"
      icon="fa:xmark"
      accent="brand"
      size="small"
      @click="clear()"
    />
    <slot v-if="slots['right-icon'] || rightIcon" name="right-icon">
      <VtsIcon :name="rightIcon" size="medium" class="right-icon" />
    </slot>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { LabelAccent } from '@core/components/ui/label/UiLabel.vue'
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { IK_INPUT_WRAPPER_CONTROLLER } from '@core/utils/injection-keys.util'
import { toVariants } from '@core/utils/to-variants.util'
import { computed, inject, ref, useAttrs, watchEffect } from 'vue'

export type InputAccent = 'brand' | 'warning' | 'danger'

export type InputType = 'text' | 'number' | 'password' | 'search'

defineOptions({
  inheritAttrs: false,
})
const {
  accent: _accent,
  required,
  disabled,
  selected,
  id,
} = defineProps<{
  accent: InputAccent
  id?: string
  required?: boolean
  disabled?: boolean
  selected?: boolean
  readonly?: boolean
  type?: InputType
  rightIcon?: IconName
  clearable?: boolean
  prefix?: string
  suffix?: string
}>()

const emit = defineEmits<{
  clear: []
}>()

const modelValue = defineModel<string | number | undefined>({ required: true })

const slots = defineSlots<{
  'right-icon'?(): any
  'prefix'?(): any
  'suffix'?(): any
}>()

function handleInput(event: Event) {
  modelValue.value = (event.target as HTMLInputElement).value
}

const attrs = useAttrs()

const inputRef = ref<HTMLInputElement>()

const wrapperController = inject(IK_INPUT_WRAPPER_CONTROLLER, undefined)

const accent = useMapper<LabelAccent, InputAccent>(
  () => wrapperController?.labelAccent,
  () => ({
    neutral: _accent,
    warning: 'warning',
    danger: 'danger',
  }),
  'neutral'
)

const isFocused = ref(false)

const isSelected = computed(() => selected ?? isFocused.value)

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
  emit('clear')
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
  width: 100%;
  text-align: left;
  padding-inline: 1.6rem;

  .right-icon {
    pointer-events: none;
    color: var(--color-brand-txt-base);
  }

  .prefix,
  .suffix {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    background-color: var(--color-neutral-background-secondary);
    padding: 0.8rem 1.6rem;
    border: 0.1rem solid var(--color-neutral-border);
    color: var(--color-neutral-txt-secondary);
  }

  .prefix {
    margin-inline-start: -1.6rem;
    border-start-start-radius: 0.4rem;
    border-end-start-radius: 0.4rem;
  }

  .suffix {
    margin-inline-end: -1.6rem;
    border-start-end-radius: 0.4rem;
    border-end-end-radius: 0.4rem;
  }

  &.disabled .right-icon {
    color: var(--color-neutral-txt-secondary);
  }

  .readonly-input {
    border: none;
    width: 0;
    padding: 0;
  }

  .input {
    background-color: transparent;
    border: none;
    outline: none;
    flex: 1;

    &::placeholder {
      color: var(--color-neutral-txt-secondary);
    }

    &::-webkit-search-cancel-button {
      -webkit-appearance: none;
    }
  }

  /* VARIANT */

  &.accent--brand {
    border-color: var(--color-neutral-border);

    &:focus-within,
    &.selected {
      border-color: var(--color-brand-item-base);
      border-width: 0.2rem;
    }

    &:hover {
      border-color: var(--color-brand-item-hover);
    }

    &:has(input:active) {
      border-color: var(--color-brand-item-active);
    }

    &.disabled {
      border-color: var(--color-neutral-border);
      background-color: var(--color-neutral-background-disabled);
    }
  }

  &.accent--warning {
    border-color: var(--color-warning-item-base);

    &:focus-within,
    &.selected {
      border-color: var(--color-warning-item-base);
    }

    &:hover {
      border-color: var(--color-warning-item-hover);
    }

    &:has(input:active) {
      border-color: var(--color-warning-item-active);
    }

    &.disabled {
      border-color: var(--color-neutral-border);
      background-color: var(--color-neutral-background-disabled);
    }
  }

  &.accent--danger {
    border-color: var(--color-danger-item-base);

    &:focus-within,
    &.selected {
      border-color: var(--color-danger-item-base);
    }

    &:hover {
      border-color: var(--color-danger-item-hover);
    }

    &:has(input:active) {
      border-color: var(--color-danger-item-active);
    }

    &.disabled {
      border-color: var(--color-neutral-border);
      background-color: var(--color-neutral-background-disabled);
    }
  }
}
</style>
