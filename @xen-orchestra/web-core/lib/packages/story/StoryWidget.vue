<template>
  <VtsSelect v-if="isSelectWidget(widget)" :id="selectId" accent="brand" />
  <div v-else-if="isRadioWidget(widget)" class="radio">
    <FormInputWrapper v-for="choice in widget.choices" :key="choice.label">
      <FormRadio v-model="model" :value="choice.value" />
      {{ choice.label }}
    </FormInputWrapper>
  </div>
  <div v-else-if="isBooleanWidget(widget)">
    <FormCheckbox v-model="model" accent="brand" />
  </div>
  <FormInput
    v-else-if="isNumberWidget(widget)"
    v-model.number="model"
    accent="brand"
    type="number"
    class="typo-body-regular-small"
  />
  <FormInput v-else-if="isTextWidget(widget)" v-model="model" accent="brand" class="typo-body-regular-small" />
  <!--  <FormJson v-else-if="isObjectWidget(widget)" v-model="model" class="typo-body-regular-small" /> -->
</template>

<script lang="ts" setup>
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import {
  isBooleanWidget,
  isNumberWidget,
  isRadioWidget,
  isSelectWidget,
  isTextWidget,
  type Widget,
} from '@core/packages/story/story-widget.ts'
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

// const FormJson = defineAsyncComponent(() => import('../../../../lite/src/components/form/FormJson.vue'))
const FormCheckbox = defineAsyncComponent(() => import('@core/components/ui/checkbox/UiCheckbox.vue'))
const FormInput = defineAsyncComponent(() => import('@core/components/ui/input/UiInput.vue'))
const FormInputWrapper = defineAsyncComponent(() => import('@core/components/input-wrapper/VtsInputWrapper.vue'))
const FormRadio = defineAsyncComponent(() => import('@core/components/ui/radio-button/UiRadioButton.vue'))

const model = useVModel(props, 'modelValue', emit)

const { id: selectId } = useFormSelect(() => (isSelectWidget(props.widget) ? props.widget.choices : []), {
  model,
  option: {
    id: 'label',
    label: 'label',
    value: 'value',
  },
})
</script>

<style lang="postcss" scoped>
.radio {
  display: flex;
  gap: 1rem;
}
</style>
