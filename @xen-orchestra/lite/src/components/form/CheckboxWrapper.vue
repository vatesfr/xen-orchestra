<template>
  <label class="checkbox-wrapper">
    <slot />
    <span class="checkbox">
      <UiIcon :fixed-width="false" :icon="icon" class="check-icon" />
    </span>
    <span class="label">
      <slot name="label">{{ label }}</slot>
    </span>
  </label>
</template>

<script lang="ts" setup>
import { inject } from "vue";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import UiIcon from "@/components/ui/UiIcon.vue";

defineProps<{
  label?: string;
}>();

const icon = inject("checkedIcon", faCheck);
</script>

<style lang="postcss" scoped>
.checkbox-wrapper {
  font-size: 1.6rem;
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 3.8rem;
  gap: 1rem;
}

.check-icon {
  visibility: hidden;
  color: var(--color-blue-scale-500);
}

:slotted(input) {
  position: absolute;
  opacity: 0;

  & ~ .checkbox {
    --background-color: var(--background-color-primary);
    --border-color: var(--color-blue-scale-400);
  }

  & ~ .label {
    --color: var(--color-blue-scale-100);
  }

  &:hover ~ .checkbox,
  &:focus ~ .checkbox {
    --border-color: var(--color-extra-blue-l40);
  }

  &:active ~ .checkbox {
    --border-color: var(--color-extra-blue-l20);
  }

  &:checked ~ .checkbox {
    --border-color: transparent;
    --background-color: var(--color-extra-blue-base);

    .check-icon {
      visibility: visible;
    }
  }

  &:checked:hover ~ .checkbox,
  &:checked:focus ~ .checkbox {
    --background-color: var(--color-extra-blue-d20);
  }

  &:checked:active ~ .checkbox {
    --background-color: var(--color-extra-blue-d40);
  }

  &:disabled ~ .label {
    --color: var(--color-blue-scale-200);
  }

  &:disabled ~ .checkbox {
    --border-color: var(--color-blue-scale-400);
    --background-color: var(--background-color-secondary);
  }

  &:disabled:checked ~ .checkbox {
    --border-color: transparent;
    --background-color: var(--color-extra-blue-l60);
  }
}

.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  min-width: 2rem;
  height: 2rem;
  border: 1px solid var(--border-color);
  border-radius: 0.4rem;
  background-color: var(--background-color);
  box-shadow: var(--shadow-100);
}

.label {
  color: var(--color);
}
</style>
