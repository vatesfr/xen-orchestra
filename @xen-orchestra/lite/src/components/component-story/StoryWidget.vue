<template>
  <VtsSelect v-if="isSelectWidget(widget)" :id="selectId" accent="brand" />
  <div v-else-if="isRadioWidget(widget)" class="radio">
    <FormInputWrapper v-for="choice in widget.choices" :key="choice.label">
      <FormRadio v-model="model" :value="choice.value" />
      {{ choice.label }}
    </FormInputWrapper>
  </div>
  <div v-else-if="isBooleanWidget(widget)">
    <FormCheckbox v-model="model" />
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
import { useFormSelect } from '@core/packages/form-select'
import { computed, defineAsyncComponent } from 'vue'

const { widget } = defineProps<{
  widget: Widget
  required?: boolean
}>()

const model = defineModel<any>({ default: undefined })

const FormJson = defineAsyncComponent(() => import('@/components/form/FormJson.vue'))
const VtsSelect = defineAsyncComponent(() => import('@core/components/select/VtsSelect.vue'))
const FormCheckbox = defineAsyncComponent(() => import('@/components/form/FormCheckbox.vue'))
const FormInput = defineAsyncComponent(() => import('@/components/form/FormInput.vue'))
const FormInputWrapper = defineAsyncComponent(() => import('@/components/form/FormInputWrapper.vue'))
const FormRadio = defineAsyncComponent(() => import('@/components/form/FormRadio.vue'))

const sources = computed(() => (isSelectWidget(widget) ? widget.choices : []))

const { id: selectId } = useFormSelect(sources, {
  model,
  searchable: computed(() => sources.value.length > 10),
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
