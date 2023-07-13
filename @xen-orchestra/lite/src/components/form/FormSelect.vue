<template>
  <span class="form-select">
    <MultiSelect
      v-model="modelValue"
      :can-clear="clearable"
      :class="colorClass"
      :close-on-deselect="!multiple"
      :close-on-select="!multiple"
      :groups="isGrouped"
      :hide-selected="false"
      :label="labelKey"
      :mode="multiple ? 'multiple' : 'single'"
      :multiple-label="getMultipleLabel"
      :no-options-text="$t('no-options-available')"
      :no-results-text="$t('no-results-found')"
      :options="options"
      :track-by="labelKey"
      :value-prop="valueKey"
      :object="object"
      :disabled="busy || disabled"
      :searchable="options.length > SEARCHABLE_THRESHOLD"
      :loading="busy"
    >
      <template #caret>
        <UiIcon :icon="faAngleDown" class="caret-icon" />
      </template>
    </MultiSelect>
  </span>
</template>

<script generic="T extends XenApiRecord<string>" lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import type { XenApiRecord } from "@/libs/xen-api";
import type { Color } from "@/types";
import { IK_FORM_INPUT_COLOR } from "@/types/injection-keys";
import { faAngleDown } from "@fortawesome/free-solid-svg-icons";
import MultiSelect from "@vueform/multiselect";
import { useVModel } from "@vueuse/core";
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";

const SEARCHABLE_THRESHOLD = 10;

const props = withDefaults(
  defineProps<{
    modelValue: any;
    multiple?: boolean;
    options: { label: string; options: T[] }[] | T[];
    labelKey?: string;
    valueKey?: string;
    clearable?: boolean;
    color?: Color;
    object?: boolean;
    disabled?: boolean;
    busy?: boolean;
  }>(),
  {
    labelKey: "label",
    valueKey: "value",
    color: undefined,
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: any): void;
}>();

const isGrouped = computed(() => {
  const option = props.options[0];
  return "object" === typeof option && "options" in option && "label" in option;
});

const modelValue = useVModel(props, "modelValue", emit);

const i18n = useI18n();

const getMultipleLabel = (values: any[]) =>
  i18n.t("n-options-selected", { n: values.length });

const parentColor = inject(IK_FORM_INPUT_COLOR, undefined);

const colorClass = computed(() => {
  const color = props.color ?? parentColor?.value ?? "info";

  return `color-${color}`;
});
</script>

<style lang="postcss" scoped>
.form-select {
  font-size: 2rem;
}
</style>
