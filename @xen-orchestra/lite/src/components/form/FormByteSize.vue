<template>
  <FormInputGroup>
    <FormInput v-model="size" type="number" />
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
import humanFormat, { type Prefix } from "human-format";
import { ref, watch } from "vue";

const props = defineProps<{
  modelValue: number;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: number): number;
}>();

const clampPrefix = (value: number) => {
  if (value < 1024) {
    return "Ki";
  }

  if (value >= 1024 ** 4) {
    return "Gi";
  }
};

const { value: initialSize, prefix: initialPrefix } = humanFormat.raw(
  props.modelValue,
  {
    scale: "binary",
    prefix: clampPrefix(props.modelValue),
  }
);

const size = ref<number>(initialSize);
const prefix = ref<Prefix<"binary">>(initialPrefix || "Ki");
const availablePrefixes: Prefix<"binary">[] = ["Ki", "Mi", "Gi"];

watch([size, prefix], ([nextSize, nextPrefix]) => {
  const byteSize = humanFormat.parse(`${nextSize || 0} ${nextPrefix}`, {
    scale: "binary",
  });

  if (byteSize !== props.modelValue) {
    emit("update:modelValue", byteSize);
  }
});

watch(
  () => props.modelValue,
  (modelValue) => {
    const { value: newSize } = humanFormat.raw(modelValue, {
      scale: "binary",
      prefix: prefix.value,
    });

    size.value = newSize;
  }
);
</script>
