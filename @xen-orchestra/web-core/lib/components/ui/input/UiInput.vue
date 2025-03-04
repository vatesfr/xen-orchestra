<!-- v5 -->
<template>
  <div class="ui-input" :class="toVariants({ accent })">
    <UiLabel v-if="slots.default || label" :accent="labelAccent" :required :icon="labelIcon" :href :for="id">
      <slot>{{ label }}</slot>
    </UiLabel>
    <div>
      <VtsIcon :icon accent="current" class="before" />
      <input
        :id
        :value
        class="typo-body-regular input text-ellipsis"
        :type
        :disabled
        v-bind="attrs"
        @change="handleChange"
        @blur="handleBlur"
      />
      <VtsIcon
        v-if="!attrs.disabled && value && clearable"
        :icon="faXmark"
        class="after"
        accent="brand"
        @click="value = ''"
      />
    </div>
    <UiInfo v-if="slots.info || info" :accent="accent === 'brand' ? 'info' : accent">
      <slot name="info">{{ info }}</slot>
    </UiInfo>
    <template v-if="!meta.valid && meta.touched">
      <UiInfo v-for="error of errors" :key="error" accent="danger">
        {{ error }}
      </UiInfo>
    </template>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { useField } from 'vee-validate'
import { computed, useAttrs, useId } from 'vue'

export type InputAccent = 'brand' | 'warning' | 'danger'
export type InputType = 'text' | 'number' | 'password' | 'search'

defineOptions({
  inheritAttrs: false,
})

const {
  accent,
  name,
  id = useId(),
} = defineProps<{
  accent: InputAccent
  name: string
  label?: string
  info?: string
  id?: string
  disabled?: boolean
  clearable?: boolean
  href?: string
  required?: boolean
  labelIcon?: IconDefinition
  icon?: IconDefinition
  type?: InputType
}>()

// const modelValue = defineModel<string | number>({ required: true })

const slots = defineSlots<{
  default?(): any
  info?(): any
}>()

const attrs = useAttrs()

const labelAccent = computed(() => (accent === 'brand' ? 'neutral' : accent))

const { value, errors, meta, handleBlur, handleChange } = useField(() => name, undefined, {
  syncVModel: true,
})
</script>

<style lang="postcss" scoped>
/* IMPLEMENTATION */
.ui-input {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;

  .input {
    border-radius: 0.4rem;
    border-width: 0.1rem;
    border-style: solid;
    background-color: var(--color-neutral-background-primary);
    color: var(--color-neutral-txt-primary);
    height: 4rem;
    outline: none;
    width: 100%;
    padding-block: 0.8rem;
    padding-inline: 1.6rem;

    &::placeholder {
      color: var(--color-neutral-txt-secondary);
    }

    &:focus {
      border-width: 0.2rem;
    }

    &:has(+ .after) {
      padding-inline-end: 4.8rem;
    }
  }

  /* VARIANT */

  &.accent--brand {
    .input {
      border-color: var(--color-neutral-border);

      &:hover {
        border-color: var(--color-brand-item-hover);
      }

      &:focus {
        border-color: var(--color-brand-item-base);
      }

      &:active {
        border-color: var(--color-brand-item-active);
      }

      &:disabled {
        border-color: var(--color-neutral-border);
        background-color: var(--color-neutral-background-disabled);
      }
    }
  }

  &.accent--warning {
    .input {
      border-color: var(--color-warning-item-base);

      &:disabled {
        border-color: var(--color-neutral-border);
        background-color: var(--color-neutral-background-disabled);
      }
    }
  }

  &.accent--danger {
    .input {
      border-color: var(--color-danger-item-base);

      &:disabled {
        border-color: var(--color-neutral-border);
        background-color: var(--color-neutral-background-disabled);
      }
    }
  }

  /* ICON POSITION */

  .before + .input {
    padding-inline-start: 4.8rem;
  }

  .before,
  .after {
    position: absolute;
    inset-block: 1.2rem;
  }

  .before {
    color: var(--color-neutral-txt-secondary);
    inset-inline-start: 1.6rem;
    pointer-events: none;
    z-index: 1;
  }

  .after {
    inset-inline-end: 1.6rem;
    cursor: pointer;
  }
}
</style>
