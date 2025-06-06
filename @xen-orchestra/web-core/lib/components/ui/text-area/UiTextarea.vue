<!-- v2 -->
<template>
  <div class="ui-textarea" :class="toVariants({ accent: hasMaxCharactersError ? 'danger' : accent })">
    <UiLabel v-if="slots.default" :accent="labelAccent" :required :icon :href :for="id">
      <slot />
    </UiLabel>
    <textarea v-bind="attrs" :id ref="textarea" v-model="model" :disabled class="textarea" />
    <UiCharacterLimit v-if="maxCharacters" :count="model.trim().length" :max="maxCharacters" />
    <UiInfo v-if="isExceedingMaxCharacters" accent="danger">
      {{ t('core.textarea.exceeds-max-characters', { max: maxCharacters }) }}
    </UiInfo>
    <UiInfo v-if="slots.info" :accent="accent === 'brand' ? 'info' : accent">
      <slot name="info" />
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import UiCharacterLimit from '@core/components/ui/character-limit/UiCharacterLimit.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { useFocus } from '@vueuse/core'
import { computed, useAttrs, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({
  inheritAttrs: false,
})

const {
  accent,
  maxCharacters,
  id = useId(),
} = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  id?: string
  maxCharacters?: number
  disabled?: boolean
  href?: string
  icon?: IconDefinition
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

const slots = defineSlots<{
  default?(): any
  info?(): any
}>()

const { t } = useI18n()

const attrs = useAttrs()

const textAreaElement = useTemplateRef('textarea')

const { focused } = useFocus(textAreaElement)

// WIP: To update when using VeeValidate and custom validation rules
const isExceedingMaxCharacters = computed(() =>
  maxCharacters !== undefined ? model.value.trim().length > maxCharacters : false
)

const hasMaxCharactersError = computed(() => !focused.value && isExceedingMaxCharacters.value)

const labelAccent = computed(() => {
  if (hasMaxCharactersError.value) {
    return 'danger'
  }

  return accent === 'brand' ? 'neutral' : accent
})
</script>

<style lang="postcss" scoped>
.ui-textarea {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .textarea {
    border-radius: 0.4rem;
    border-width: 0.1rem;
    background-color: var(--color-neutral-background-primary);
    height: 8rem;
    outline: none;
    padding: 0.8rem 1.6rem;
    width: 100%;
  }

  &.accent--brand {
    .textarea {
      border-color: var(--color-neutral-border);

      &:hover {
        border-color: var(--color-brand-item-hover);
      }

      &:active {
        border-color: var(--color-brand-item-active);
      }

      &:focus:not(:active) {
        border-width: 0.2rem;
        border-color: var(--color-brand-item-base);
      }

      &:disabled {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-border);
      }
    }
  }

  &.accent--warning {
    .textarea {
      border-color: var(--color-warning-item-base);

      &:hover {
        border-color: var(--color-warning-item-hover);
      }

      &:active {
        border-color: var(--color-warning-item-active);
      }

      &:focus:not(:active) {
        border-width: 0.2rem;
        border-color: var(--color-warning-item-base);
      }

      &:disabled {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-border);
      }
    }
  }

  &.accent--danger {
    .textarea {
      border-color: var(--color-danger-item-base);

      &:hover {
        border-color: var(--color-danger-item-hover);
      }

      &:active {
        border-color: var(--color-danger-item-active);
      }

      &:focus:not(:active) {
        border-width: 0.2rem;
        border-color: var(--color-danger-item-base);
      }

      &:disabled {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-border);
      }
    }
  }
}
</style>
