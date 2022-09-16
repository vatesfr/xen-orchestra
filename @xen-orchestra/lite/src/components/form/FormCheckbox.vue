<template>
  <component
    :is="hasLabel ? 'span' : 'label'"
    :class="type === 'checkbox' ? 'form-checkbox' : 'form-radio'"
  >
    <input
      v-model="value"
      :disabled="isLabelDisabled || disabled"
      :type="type"
      class="input"
      v-bind="$attrs"
    />
    <span class="fake-checkbox">
      <UiIcon :fixed-width="false" :icon="icon" class="icon" />
    </span>
  </component>
</template>

<script lang="ts">
export default {
  name: "FormCheckbox",
  inheritAttrs: false,
};
</script>

<script lang="ts" setup>
import { type InputHTMLAttributes, computed, inject, ref } from "vue";
import { faCheck, faCircle } from "@fortawesome/free-solid-svg-icons";
import { useVModel } from "@vueuse/core";
import UiIcon from "@/components/ui/UiIcon.vue";

interface Props extends Omit<InputHTMLAttributes, ""> {
  modelValue?: unknown;
  disabled?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const value = useVModel(props, "modelValue", emit);
const type = inject("inputType", "checkbox");
const hasLabel = inject("hasLabel", false);
const isLabelDisabled = inject("isLabelDisabled", ref(false));
const icon = computed(() => (type === "checkbox" ? faCheck : faCircle));
</script>

<style lang="postcss" scoped>
.form-checkbox,
.form-radio {
  display: inline-flex;
  width: 2rem;
  height: 2rem;

  --checkbox-border-radius: 0.4rem;
  --checkbox-icon-size: 1.6rem;
  --checkbox-border-width: 0.1rem;
}

.form-radio {
  --checkbox-border-radius: 1rem;
  --checkbox-icon-size: 1rem;
}

.input {
  position: absolute;
  pointer-events: none;
  opacity: 0;
}

.icon {
  font-size: var(--checkbox-icon-size);
  position: absolute;
  visibility: hidden;
  color: var(--color-blue-scale-500);
}

.input:checked + .fake-checkbox > .icon {
  visibility: visible;
}

.fake-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: var(--checkbox-border-width) solid var(--border-color);
  border-radius: var(--checkbox-border-radius);
  background-color: var(--background-color);
  box-shadow: var(--shadow-100);

  --border-color: var(--color-blue-scale-400);
  --background-color: var(--background-color-primary);
}

.input:disabled {
  & + .fake-checkbox {
    --background-color: var(--background-color-secondary);
    --border-color: var(--color-blue-scale-400);
  }

  &:checked + .fake-checkbox {
    --border-color: transparent;
    --background-color: var(--color-extra-blue-l60);
  }
}

.input:not(:disabled) {
  &:hover + .fake-checkbox,
  &:focus + .fake-checkbox {
    --border-color: var(--color-extra-blue-l40);
  }

  &:active + .fake-checkbox {
    --border-color: var(--color-extra-blue-l20);
  }

  &:checked + .fake-checkbox {
    --border-color: transparent;
    --background-color: var(--color-extra-blue-base);
  }

  &:checked:hover + .fake-checkbox,
  &:checked:focus + .fake-checkbox {
    --background-color: var(--color-extra-blue-d20);
  }

  &:checked:active + .fake-checkbox {
    --background-color: var(--color-extra-blue-d40);
  }
}
</style>
