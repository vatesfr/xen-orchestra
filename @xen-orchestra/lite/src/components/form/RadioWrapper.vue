<template>
  <CheckboxWrapper :label="label">
    <template #default>
      <slot />
    </template>
    <template #label>
      <slot name="label" />
    </template>
  </CheckboxWrapper>
</template>

<script lang="ts" setup>
import { provide } from "vue";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import CheckboxWrapper from "@/components/form/CheckboxWrapper.vue";

defineProps<{
  label?: string;
}>();

provide("checkedIcon", faCircle);
</script>

<style lang="postcss" scoped>
.checkbox-wrapper :deep(.checkbox) {
  font-size: 1rem;
  border-radius: 1.9rem;
}
</style>
