<template>
  <component
    :is="hasLabel ? 'span' : 'label'"
    :class="`form-${type}`"
    v-bind="wrapperAttrs"
  >
    <input
      v-model="value"
      :class="{ indeterminate: type === 'checkbox' && value === undefined }"
      :disabled="isLabelDisabled || disabled"
      :type="type === 'radio' ? 'radio' : 'checkbox'"
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
import {
  type HTMLAttributes,
  type InputHTMLAttributes,
  computed,
  inject,
  ref,
} from "vue";
import { faCheck, faCircle, faMinus } from "@fortawesome/free-solid-svg-icons";
import { useVModel } from "@vueuse/core";
import UiIcon from "@/components/ui/icon/UiIcon.vue";

// Temporary workaround for https://github.com/vuejs/core/issues/4294
interface Props extends Omit<InputHTMLAttributes, ""> {
  modelValue?: unknown;
  disabled?: boolean;
  wrapperAttrs?: HTMLAttributes;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const value = useVModel(props, "modelValue", emit);
const type = inject<"checkbox" | "radio" | "toggle">("inputType", "checkbox");
const hasLabel = inject("hasLabel", false);
const isLabelDisabled = inject("isLabelDisabled", ref(false));
const icon = computed(() => {
  if (type !== "checkbox") {
    return faCircle;
  }

  if (value.value === undefined) {
    return faMinus;
  }

  return faCheck;
});
</script>

<style lang="postcss" scoped>
.form-toggle,
.form-checkbox,
.form-radio {
  display: inline-flex;
  height: 1.25em;

  --checkbox-border-width: 0.0625em;
}

.form-radio {
  --checkbox-border-radius: 0.625em;
  --checkbox-icon-size: 0.625em;
}

.form-checkbox {
  --checkbox-border-radius: 0.25em;
  --checkbox-icon-size: 1em;

  .input.indeterminate + .fake-checkbox > .icon {
    opacity: 1;
    color: var(--color-blue-scale-300);
  }
}

.form-checkbox,
.form-radio {
  width: 1.25em;

  .fake-checkbox {
    width: 1.25em;
    --background-color: var(--background-color-primary);
  }

  .icon {
    transition: opacity 0.125s ease-in-out;
  }

  .input + .fake-checkbox > .icon {
    opacity: 0;
  }

  .input:checked + .fake-checkbox > .icon {
    opacity: 1;
  }
}

.form-toggle {
  width: 2.5em;
  --checkbox-border-radius: 0.625em;
  --checkbox-icon-size: 0.875em;

  .fake-checkbox {
    width: 2.5em;
    --background-color: var(--color-blue-scale-400);
  }

  .icon {
    transition: transform 0.125s ease-in-out;
    transform: translateX(-0.7em);
  }

  .input:checked + .fake-checkbox > .icon {
    transform: translateX(0.7em);
  }
}

.input {
  font-size: inherit;
  position: absolute;
  pointer-events: none;
  opacity: 0;
}

.icon {
  font-size: var(--checkbox-icon-size);
  position: absolute;
  color: var(--color-blue-scale-500);

  filter: drop-shadow(0 0.0625em 0.5em rgba(0, 0, 0, 0.1))
    drop-shadow(0 0.1875em 0.1875em rgba(0, 0, 0, 0.06))
    drop-shadow(0 0.1875em 0.25em rgba(0, 0, 0, 0.08));
}

.fake-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.25em;
  transition: background-color 0.125s ease-in-out,
    border-color 0.125s ease-in-out;
  border: var(--checkbox-border-width) solid var(--border-color);
  border-radius: var(--checkbox-border-radius);
  background-color: var(--background-color);
  box-shadow: var(--shadow-100);

  --border-color: var(--color-blue-scale-400);
}

.input:disabled {
  & + .fake-checkbox {
    cursor: not-allowed;
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
