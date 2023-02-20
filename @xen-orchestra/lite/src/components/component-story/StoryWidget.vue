<template>
  <FormSelect
    v-if="isSelectWidget(widget)"
    v-model="model"
    :wrapper-attrs="{ class: 'full-width' }"
  >
    <option v-if="!required && model === undefined" :value="undefined" />
    <option
      v-for="choice in widget.choices"
      :key="choice.label"
      :value="choice.value"
    >
      {{ choice.label }}
    </option>
  </FormSelect>
  <div v-else-if="isRadioWidget(widget)" class="radio">
    <FormInputWrapper v-for="choice in widget.choices" :key="choice.label">
      <FormRadio v-model="model" :value="choice.value" />
      {{ choice.label }}
    </FormInputWrapper>
  </div>
  <div v-else-if="isBooleanWidget(widget)">
    <FormCheckbox v-model="model" />
  </div>
  <FormInput
    v-else-if="isNumberWidget(widget)"
    v-model.number="model"
    type="number"
  />
  <FormInput v-else-if="isTextWidget(widget)" v-model="model" />
  <FormJson v-else-if="isObjectWidget(widget)" v-model="model" />
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
} from "@/libs/story/story-widget";
import { useVModel } from "@vueuse/core";
import { defineAsyncComponent } from "vue";

const FormJson = defineAsyncComponent(
  () => import("@/components/form/FormJson.vue")
);
const FormSelect = defineAsyncComponent(
  () => import("@/components/form/FormSelect.vue")
);
const FormCheckbox = defineAsyncComponent(
  () => import("@/components/form/FormCheckbox.vue")
);
const FormInput = defineAsyncComponent(
  () => import("@/components/form/FormInput.vue")
);
const FormInputWrapper = defineAsyncComponent(
  () => import("@/components/form/FormInputWrapper.vue")
);
const FormRadio = defineAsyncComponent(
  () => import("@/components/form/FormRadio.vue")
);

const props = defineProps<{
  widget: Widget;
  modelValue: any;
  required?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: any): void;
}>();

const model = useVModel(props, "modelValue", emit);
</script>

<style lang="postcss" scoped>
.radio {
  display: flex;
  gap: 1rem;
}
</style>
