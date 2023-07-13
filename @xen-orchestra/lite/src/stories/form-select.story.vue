<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      model().required().type('any'),
      prop('options').required().arr().preset(options),
      prop('multiple').bool().widget().onChange(handleMultipleChange),
      prop('labelKey')
        .default('label')
        .str()
        .help(
          'If `options` is an array of objects, item label will be extracted from this key'
        ),
      prop('valueKey')
        .default('value')
        .str()
        .help(
          'If `options` is an array of objects, item value will be extracted from this key'
        ),
      prop('clearable')
        .bool()
        .widget()
        .help('When true, adds a clear button on the right side of the select'),
      colorProp(),
      prop('disabled').bool().widget(),
      prop('object')
        .bool()
        .widget()
        .help(
          'If `options` is an array of objects, the whole object will be selected instead of only the value'
        ),
    ]"
  >
    <FormSelect v-if="isActive" v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import FormSelect from "@/components/form/FormSelect.vue";
import { colorProp, model, prop } from "@/libs/story/story-param";
import { nextTick, ref } from "vue";

const options = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
  { label: "Option 3", value: "3" },
];

// Workaround to prevent errors when `multiple` changes
const isActive = ref(true);

const handleMultipleChange = (isMultiple, context) => {
  isActive.value = false;
  context.modelValue = isMultiple ? [] : null;
  nextTick(() => {
    isActive.value = true;
  });
};
</script>
