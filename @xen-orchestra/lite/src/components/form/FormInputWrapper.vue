<template>
  <div class="wrapper">
    <label
      v-if="$slots.label"
      class="form-label"
      :class="{ disabled, ...formInputWrapperClass }"
    >
      <slot />
    </label>
    <slot />
    <p v-if="hasError || hasWarning" :class="formInputWrapperClass">
      <UiIcon :icon="faCircleExclamation" v-if="hasError" />{{
        error ?? warning
      }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed, provide, useSlots } from "vue";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import UiIcon from "@/components/ui/icon/UiIcon.vue";

const slots = useSlots();

const props = defineProps<{
  disabled?: boolean;
  error?: string;
  warning?: string;
}>();

provide("hasLabel", slots.label !== undefined);
provide(
  "isLabelDisabled",
  computed(() => props.disabled)
);

const hasError = computed(
  () => props.error !== undefined && props.error.trim() !== ""
);
const hasWarning = computed(
  () => props.warning !== undefined && props.warning.trim() !== ""
);

provide(
  "color",
  computed(() =>
    hasError.value ? "error" : hasWarning.value ? "warning" : undefined
  )
);

const formInputWrapperClass = computed(() => ({
  error: hasError.value,
  warning: !hasError.value && hasWarning.value,
}));
</script>

<style lang="postcss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
}

.wrapper :deep(.input) {
  margin-bottom: 1rem;
}

.form-label {
  font-size: 1.6rem;
  display: inline-flex;
  align-items: center;
  gap: 0.625em;

  &.disabled {
    cursor: not-allowed;
    color: var(--color-blue-scale-300);
  }
}
p.error,
p.warning {
  font-size: 0.65em;
  margin-bottom: 1rem;
}

.error {
  color: var(--color-red-vates-base);
}

.warning {
  color: var(--color-orange-world-base);
}

p svg {
  margin-right: 0.4em;
}
</style>
