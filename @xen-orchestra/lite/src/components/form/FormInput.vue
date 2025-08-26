<template>
  <span :class="wrapperClass" class="container" v-bind="wrapperAttrs">
    <input
      :id
      ref="inputElement"
      v-model="value"
      :class="inputClass"
      :disabled="isDisabled"
      :required
      class="input"
      v-bind="attrs"
    />
    <span v-if="before !== undefined" class="before">
      <VtsIcon :name="before" class="before" size="medium" />
    </span>
    <span v-if="after !== undefined" class="after">
      <VtsIcon :name="after" class="after" size="medium" />
    </span>
  </span>
</template>

<script lang="ts" setup>
import { useContext } from '@/composables/context.composable'
import { ColorContext } from '@/context'
import type { Color } from '@/types'
import { IK_INPUT_ID, IK_INPUT_TYPE } from '@/types/injection-keys'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable'
import { useVModel } from '@vueuse/core'
import { computed, type HTMLAttributes, inject, ref, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  id?: string
  modelValue?: any
  color?: Color
  before?: IconName
  after?: IconName
  beforeWidth?: string
  afterWidth?: string
  disabled?: boolean
  required?: boolean
  right?: boolean
  wrapperAttrs?: HTMLAttributes
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const attrs = useAttrs()

const { name: contextColor } = useContext(ColorContext, () => props.color)

const inputElement = ref()

const value = useVModel(props, 'modelValue', emit)
const isEmpty = computed(() => props.modelValue == null || String(props.modelValue).trim() === '')
const inputType = inject(IK_INPUT_TYPE, 'input')

const isDisabled = useDisabled(() => props.disabled)

const wrapperClass = computed(() => [
  `form-${inputType}`,
  {
    disabled: isDisabled.value,
    empty: isEmpty.value,
  },
])

const inputClass = computed(() => [
  contextColor.value,
  {
    right: props.right,
    'has-before': props.before !== undefined,
    'has-after': props.after !== undefined,
  },
])

const parentId = inject(IK_INPUT_ID, undefined)

const id = computed(() => props.id ?? parentId?.value)

const focus = () => inputElement.value.focus()

defineExpose({
  focus,
})
</script>

<style lang="postcss" scoped>
.container {
  font-size: 2rem;
}

.form-input {
  display: grid;
  align-items: stretch;
  max-width: 30em;

  --before-width: v-bind('beforeWidth || "1.75em"');
  --after-width: v-bind('afterWidth || "1.625em"');

  --text-color: var(--color-neutral-txt-primary);

  &.empty {
    --text-color: var(--color-neutral-txt-secondary);
  }

  &.disabled {
    --text-color: var(--color-neutral-border);
  }
}

.form-input {
  grid-template-columns: var(--before-width) auto var(--after-width);
}

.input {
  font-size: 1em;
  width: 100%;
  height: 4rem;
  margin: 0;
  color: var(--text-color);
  border: 0.1rem solid var(--border-color);
  border-radius: 0.4rem;
  outline: none;
  background-color: var(--background-color);
  box-shadow: var(--shadow-100);
  grid-row: 1 / 2;
  grid-column: 1 / 4;

  &.right {
    text-align: right;
  }

  --background-color: var(--color-neutral-background-primary);
  --border-color: var(--color-neutral-border);

  &:disabled {
    cursor: not-allowed;
    --background-color: var(--color-neutral-background-disabled);
  }

  &:not(:disabled) {
    &.info {
      &:hover {
        --border-color: var(--color-brand-item-hover);
      }

      &:active {
        --border-color: var(--color-brand-item-active);
      }

      &:focus {
        --border-color: var(--color-brand-item-base);
      }
    }

    &.success {
      --border-color: var(--color-success-item-base);

      &:hover {
        --border-color: var(--color-success-item-hover);
      }

      &:active {
        --border-color: var(--color-success-item-active);
      }

      &:focus {
        --border-color: var(--color-success-item-base);
      }
    }

    &.warning {
      --border-color: var(--color-warning-item-base);

      &:hover {
        --border-color: var(--color-warning-item-hover);
      }

      &:active {
        --border-color: var(--color-warning-item-active);
      }

      &:focus {
        --border-color: var(--color-warning-item-base);
      }
    }

    &.error {
      --border-color: var(--color-danger-item-base);

      &:hover {
        --border-color: var(--color-danger-item-hover);
      }

      &:active {
        --border-color: var(--color-danger-item-active);
      }

      &:focus-within {
        --border-color: var(--color-danger-item-base);
      }
    }
  }
}

.input {
  padding: 0;
}

.input {
  padding-right: 0.625em;
  padding-left: 0.625em;

  &.has-before {
    padding-left: calc(var(--before-width) + 0.25em);
  }

  &.has-after {
    padding-right: calc(var(--after-width) + 0.25em);
  }
}

.before,
.after {
  display: inline-flex;
  align-items: center;
  pointer-events: none;
  color: var(--text-color);
  grid-row: 1 / 2;
}

.before {
  justify-self: end;
  grid-column: 1 / 2;
}

.after {
  justify-self: start;
  grid-column: 3 / 4;
}
</style>
