<template>
  <VtsSelect v-if="isSelectWidget(widget)" :id="selectId" accent="brand" />
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
import { useFormSelect } from '@core/packages/form-select'
import { computed, defineAsyncComponent } from 'vue'

const { widget } = defineProps<{
  widget: Widget
  required?: boolean
}>()

const model = defineModel<any>({ default: undefined })

const FormJson = defineAsyncComponent(() => import('@/components/form/FormJson.vue'))
const VtsSelect = defineAsyncComponent(() => import('@core/components/select/VtsSelect.vue'))
const UiCheckbox = defineAsyncComponent(() => import('@core/components/ui/checkbox/UiCheckbox.vue'))
const FormInput = defineAsyncComponent(() => import('@/components/form/FormInput.vue'))
const UiRadioButton = defineAsyncComponent(() => import('@core/components/ui/radio-button/UiRadioButton.vue'))
const UiRadioButtonGroup = defineAsyncComponent(
  () => import('@core/components/ui/radio-button-group/UiRadioButtonGroup.vue')
)

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
