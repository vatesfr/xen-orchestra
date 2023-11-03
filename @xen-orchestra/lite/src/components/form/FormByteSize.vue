<template>
  <FormInputGroup>
    <FormInput v-model="size" min="0" step="0.5" type="number" />
    <FormSelect v-model="prefix">
      <option
        v-for="currentPrefix in availablePrefixes"
        :key="currentPrefix"
        :value="currentPrefix"
      >
        {{ currentPrefix }}B
      </option>
    </FormSelect>
  </FormInputGroup>
</template>

<script lang="ts" setup>
import FormInput from "@/components/form/FormInput.vue";
import FormInputGroup from "@/components/form/FormInputGroup.vue";
import FormSelect from "@/components/form/FormSelect.vue";
import { useVModel } from "@vueuse/core";
import humanFormat, { type Prefix } from "human-format";
import { computed } from "vue";

const props = defineProps<{
  modelValue: number;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: number): number;
}>();

const availablePrefixes: Prefix<"binary">[] = ["Ki", "Mi", "Gi"];

const model = useVModel(props, "modelValue", emit, {
  shouldEmit: (value) => value !== props.modelValue,
});

const scale = humanFormat.Scale.create(availablePrefixes, 1024, 1);

const rawValue = computed(() =>
  humanFormat.raw(props.modelValue, {
    scale,
    maxDecimals: "auto",
  })
);

const parse = (value: number, prefix: string) =>
  humanFormat.parse(`${value || 0} ${prefix}`, {
    scale,
  });

const size = computed<number>({
  get: () => rawValue.value.value,
  set: (newSize) => {
    model.value = parse(newSize, prefix.value);
  },
});

const prefix = computed<Prefix<"binary">>({
  get: () => rawValue.value.prefix,
  set: (newPrefix) => {
    model.value = parse(size.value, newPrefix);
  },
});
</script>
