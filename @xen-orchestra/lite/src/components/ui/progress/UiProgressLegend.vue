<template>
  <div class="legend">
    <span class="circle" />
    <slot name="label">{{ label }}</slot>
    <UiBadge class="badge">
      <slot name="value">{{ value }}</slot>
    </UiBadge>
  </div>
</template>

<script lang="ts" setup>
import UiBadge from "@/components/ui/UiBadge.vue";

defineProps<{
  label?: string;
  value?: string;
}>();
</script>

<style scoped lang="postcss">
.badge {
  font-size: 0.9em;
  font-weight: 700;
}

.circle {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: 0.5rem;
  background-color: var(--progress-bar-color);
}

.legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin: 1.6em 0;
}
</style>
