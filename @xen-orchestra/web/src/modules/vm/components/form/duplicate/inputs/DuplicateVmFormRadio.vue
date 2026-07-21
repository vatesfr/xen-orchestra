<template>
  <UiRadioButtonGroup :label accent="brand" :gap="uiStore.isSmall ? 'narrow' : 'wide'">
    <UiRadioButton
      v-for="option of options"
      :key="option.value"
      v-model="model"
      accent="brand"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </UiRadioButton>
    <template v-if="slots.info" #info>
      <slot name="info" />
    </template>
  </UiRadioButtonGroup>
</template>

<script setup lang="ts" generic="TValue extends string">
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { useUiStore } from '@core/stores/ui.store.ts'

defineProps<{
  label?: string
  options: { label: string; value: TValue; disabled?: boolean }[]
}>()

const model = defineModel<TValue>({ required: true })

const slots = defineSlots<{
  info?(): any
}>()

const uiStore = useUiStore()
</script>
