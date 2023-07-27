<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      model().type('XenApiRecord').required(),
      prop('multiple').bool().widget().onChange(handleMultipleChange),
      prop('options')
        .required()
        .arr()
        .type('XenApiRecord[] | XenApiRecordGroup[]')
        .widget()
        .preset(options),
      colorProp(),
      prop('disabled').bool().widget(),
    ]"
  >
    <FormXapiRecord v-if="isActive" v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import FormXapiRecord from "@/components/form/FormXapiRecord.vue";
import { colorProp, model, prop } from "@/libs/story/story-param";
import { nextTick, ref } from "vue";

const options = [
  {
    label: "ISOs - Storage Lab",
    options: [
      {
        $ref: "1",
        name_label: "AlmaLinux-8.3-x86_64-minimal.iso",
      },
      {
        $ref: "2",
        name_label: "AlmaLinux-8.5-x86_64-boot.iso",
      },
      { $ref: "3", name_label: "CentOS-6.10-i386-minimal.iso" },
    ],
  },
  {
    label: "XCP-ng Tools - XO Lab",
    options: [{ $ref: "4", name_label: "guest-tools.iso" }],
  },
];

// Workaround to prevent errors when `multiple` is changed
const isActive = ref(true);

const handleMultipleChange = (isMultiple, context) => {
  isActive.value = false;
  context.modelValue = isMultiple ? [] : null;
  nextTick(() => {
    isActive.value = true;
  });
};
</script>
