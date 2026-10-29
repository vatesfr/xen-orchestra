<template>
  <UiCheckboxGroup :accent :vertical="uiStore.isSmall">
    <template #label>
      <UiLabel :accent="labelAccent">{{ label }}</UiLabel>
    </template>
    <UiCheckbox v-for="option of options" :key="option.value" v-model="model" :accent :value="option.value">
      {{ option.label }}
    </UiCheckbox>
    <template v-if="errorMessages.length > 0" #info>
      <UiInfo v-for="message of errorMessages" :key="message" accent="danger" wrap>
        {{ message }}
      </UiInfo>
    </template>
  </UiCheckboxGroup>
</template>

<script setup lang="ts" generic="TValue extends string">
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'

const { error } = defineProps<{
  label: string
  options: { label: string; value: TValue }[]
  error?: InputWrapperMessage
}>()

const model = defineModel<TValue[]>({ required: true })

const uiStore = useUiStore()

const errorMessages = computed(() =>
  toArray(error).map(message => (typeof message === 'object' ? message.content : message))
)

const accent = computed(() => (errorMessages.value.length > 0 ? 'danger' : 'brand'))

const labelAccent = computed(() => (errorMessages.value.length > 0 ? 'danger' : 'neutral'))
</script>
