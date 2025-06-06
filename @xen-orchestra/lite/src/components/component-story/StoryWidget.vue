<template>
  <FormSelect
    v-if="isSelectWidget(widget)"
    v-model="model"
    :wrapper-attrs="{ class: 'full-width' }"
    class="typo-body-regular-small"
  >
    <option v-if="!required && model === undefined" :value="undefined" />
    <option v-for="choice in widget.choices" :key="choice.label" :value="choice.value">
      {{ choice.label }}
    </option>
  </FormSelect>
  <UiRadioButtonGroup v-else-if="isRadioWidget(widget)" accent="brand">
    <UiRadioButton
      v-for="choice in widget.choices"
      :key="choice.label"
      v-model="model"
      accent="brand"
      :value="choice.value"
    >
      {{ choice.label }}
    </UiRadioButton>
  </UiRadioButtonGroup>
  <div v-else-if="isBooleanWidget(widget)">
    <UiCheckbox v-model="model" accent="brand" />
  </div>
  <FormInput v-else-if="isNumberWidget(widget)" v-model.number="model" type="number" class="typo-body-regular-small" />
  <FormInput v-else-if="isTextWidget(widget)" v-model="model" class="typo-body-regular-small" />
  <FormJson v-else-if="isObjectWidget(widget)" v-model="model" class="typo-body-regular-small" />
</template>

<script lang="ts" setup>
import {
  isBooleanWidget,
  isNumberWidget,
  isObjectWidget,
  isRadioWidget,
  isSelectWidget,
  isTextWidget,
  type Widget,
} from '@/libs/story/story-widget'
import { useVModel } from '@vueuse/core'
import { defineAsyncComponent } from 'vue'

const props = defineProps<{
  widget: Widget
  modelValue: any
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const FormJson = defineAsyncComponent(() => import('@/components/form/FormJson.vue'))
const FormSelect = defineAsyncComponent(() => import('@/components/form/FormSelect.vue'))
const UiCheckbox = defineAsyncComponent(() => import('@core/components/ui/checkbox/UiCheckbox.vue'))
const FormInput = defineAsyncComponent(() => import('@/components/form/FormInput.vue'))
const UiRadioButton = defineAsyncComponent(() => import('@core/components/ui/radio-button/UiRadioButton.vue'))
const UiRadioButtonGroup = defineAsyncComponent(
  () => import('@core/components/ui/radio-button-group/UiRadioButtonGroup.vue')
)

const model = useVModel(props, 'modelValue', emit)
</script>

<style lang="postcss" scoped>
.radio {
  display: flex;
  gap: 1rem;
}
</style>
