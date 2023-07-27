<template>
  <FormSelect
    object
    v-model="modelValue"
    :color="color"
    :multiple="multiple"
    :options="options"
    label-key="name_label"
    value-key="$ref"
  />
</template>

<script generic="T extends XenApiRecord<string>" lang="ts" setup>
import FormSelect from "@/components/form/FormSelect.vue";
import type { XenApiRecord } from "@/libs/xen-api";
import type { Color } from "@/types";
import { useVModel } from "@vueuse/core";

const props = defineProps<{
  modelValue: any;
  multiple?: boolean;
  options: { label: string; options: T[] }[] | T[];
  color?: Color;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: any): void;
}>();

const modelValue = useVModel(props, "modelValue", emit);
</script>
