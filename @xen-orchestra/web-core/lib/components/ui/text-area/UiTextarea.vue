<!-- v6 -->
<template>
  <div class="ui-textarea" :class="toVariants({ accent: isExceedingMaxCharacters ? 'danger' : accent })">
    <UiLabel v-if="slots.default" :accent :required :href :for="id">
      <slot />
    </UiLabel>
    <textarea v-bind="attrs" :id ref="textarea" v-model="model" :disabled class="textarea typo-body-regular" />
    <UiCharacterLimit v-if="maxCharacters" :count="model.trim().length" :max="maxCharacters" />
    <UiInfo v-if="slots.info" accent="info">
      <slot name="info" />
    </UiInfo>
    <UiInfo v-if="isExceedingMaxCharacters" accent="danger">
      {{ t('field:exceeds-max-characters', { max: maxCharacters }) }}
    </UiInfo>
    <UiInfo v-if="slots.message && accent !== 'neutral'" :accent>
      <slot name="message" />
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import UiCharacterLimit from '@core/components/ui/character-limit/UiCharacterLimit.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { toVariants } from '@core/utils/to-variants.util.ts'
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
  accent: 'neutral' | 'warning' | 'danger'
  id?: string
  maxCharacters?: number
  disabled?: boolean
  href?: string
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

const slots = defineSlots<{
  default?(): any
  info?(): any
  message?(): any
}>()

const { t } = useI18n()

const attrs = useAttrs()

const textAreaElement = useTemplateRef('textarea')

const { focused } = useFocus(textAreaElement)

// WIP: To update when using VeeValidate and custom validation rules
const isExceedingMaxCharacters = computed(() =>
  maxCharacters ? !focused.value && model.value.trim().length > maxCharacters : false
)
</script>

<style lang="postcss" scoped>
.ui-textarea {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  /* VARIANT */

  &.accent--neutral {
    --idle-color: var(--color-neutral-txt-secondary);
    --hover-color: var(--color-brand-txt-hover);
    --active-color: var(--color-brand-txt-active);
    --selected-color: var(--color-brand-txt-base);
  }

  &.accent--warning {
    --idle-color: var(--color-warning-txt-base);
    --hover-color: var(--color-warning-txt-hover);
    --active-color: var(--color-warning-txt-active);
    --selected-color: var(--color-warning-txt-base);
  }

  &.accent--danger {
    --idle-color: var(--color-danger-txt-base);
    --hover-color: var(--color-danger-txt-hover);
    --active-color: var(--color-danger-txt-active);
    --selected-color: var(--color-danger-txt-base);
  }

  .textarea {
    border-radius: 0.4rem;
    border-width: 0.1rem;
    border-style: solid;
    border-color: var(--idle-color);
    background-color: var(--color-neutral-background-primary);
    height: 8rem;
    outline: none;
    padding: 0.8rem 1.6rem;
    width: 100%;

    &:hover {
      border-color: var(--hover-color);
    }

    &:active {
      border-color: var(--active-color);
    }

    &:disabled {
      border-color: var(--color-neutral-txt-secondary);
      background-color: var(--color-neutral-background-disabled);
    }

    &:focus {
      border-color: var(--selected-color);
      border-width: 0.2rem;
      padding: 0.7rem 1.5rem;
    }
  }
}
</style>
