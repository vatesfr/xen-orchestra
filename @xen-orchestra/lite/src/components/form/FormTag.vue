<template>
  <span class="form-tag">
    <MultiSelect
      v-model="modelValue"
      :class="colorClass"
      :create-option="allowNew"
      :no-options-text="$t('no-options-available')"
      :no-results-text="$t('no-results-found')"
      :on-create="handleCreate"
      :options="options"
      :searchable="allowNew || options.length > SEARCHABLE_THRESHOLD"
      mode="tags"
      @deselect="($event) => handleDeselect($event as string)"
      :disabled="disabled"
    >
      <template #caret>
        <UiIcon :icon="faAngleDown" class="caret-icon" />
      </template>
    </MultiSelect>
  </span>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import type { Color } from "@/types";
import { IK_FORM_INPUT_COLOR } from "@/types/injection-keys";
import { faAngleDown } from "@fortawesome/free-solid-svg-icons";
import MultiSelect from "@vueform/multiselect";
import { useVModel } from "@vueuse/core";
import { computed, inject } from "vue";

const SEARCHABLE_THRESHOLD = 10;

const props = withDefaults(
  defineProps<{
    modelValue: any;
    createdTags?: string[];
    options: string[];
    allowNew?: boolean;
    color?: Color;
    disabled?: boolean;
  }>(),
  { createdTags: () => [] }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: string[]): void;
  (event: "update:createdTags", value: string[]): void;
}>();

const modelValue = useVModel(props, "modelValue", emit);

const handleCreate = (tag: { label: string; value: string }) => {
  emit("update:createdTags", [...props.createdTags, tag.value]);
  return tag;
};

const handleDeselect = (value: string) => {
  if (!props.allowNew) {
    return;
  }

  emit(
    "update:createdTags",
    props.createdTags.filter((t) => t !== value)
  );
};

const parentColor = inject(IK_FORM_INPUT_COLOR, undefined);

const colorClass = computed(() => {
  const color = props.color ?? parentColor?.value ?? "info";

  return `color-${color}`;
});
</script>

<style lang="postcss" scoped>
.form-tag {
  font-size: 2rem;
}
</style>
