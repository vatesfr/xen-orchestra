<template>
  <div class="progress-bar-component">
    <div class="progress-bar">
      <div class="progress-bar-fill" />
    </div>
    <div class="badge" v-if="label !== undefined">
      <span class="circle" />
      {{ label }}
      <UiBadge>{{ badgeLabel ?? progressWithUnit }}</UiBadge>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import UiBadge from "@/components/ui/UiBadge.vue";

interface Props {
  value: number;
  badgeLabel?: string | number;
  label?: string;
  maxValue?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxValue: 100,
});

const progressWithUnit = computed(() => {
  const progress = Math.round((props.value / props.maxValue) * 100);
  return `${progress}%`;
});
</script>

<style lang="postcss" scoped>
.badge {
  text-align: right;
  margin: 1rem 0;
}

.circle {
  display: inline-block;
  height: 10px;
  width: 10px;
  background-color: #716ac6;
  border-radius: 1rem;
}

.progress-bar {
  overflow: hidden;
  height: 1.2rem;
  border-radius: 0.4rem;
  background-color: var(--color-blue-scale-400);
  margin: 1rem 0;
}

.progress-bar-fill {
  transition: width 1s ease-in-out;
  width: v-bind(progressWithUnit);
  height: 1.2rem;
  background-color: var(--color-extra-blue-d20);
}
</style>
