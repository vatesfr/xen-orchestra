<template>
  <svg
    class="progress-circle"
    viewBox="0 0 36 36"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      class="progress-circle-background"
      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
    />
    <path
      class="progress-circle-fill"
      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
    />
    <text class="progress-circle-text" text-anchor="middle" x="50%" y="50%">
      {{ progress }}%
    </text>
  </svg>
</template>

<script lang="ts" setup>
import { computed } from "vue";

interface Props {
  value: number;
  maxValue?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxValue: 100,
});

const progress = computed(() => {
  if (props.maxValue === 0) {
    return 0;
  }

  return Math.round((props.value / props.maxValue) * 100);
});
</script>

<style lang="postcss" scoped>
.progress-circle-fill {
  animation: progress 1s ease-out forwards;
  fill: none;
  stroke: var(--color-green-infra-base);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-dasharray: v-bind(progress), 100;
}

.progress-circle-background {
  fill: none;
  stroke-width: 1.2;
  stroke: var(--color-blue-scale-400);
}

.progress-circle-text {
  font-size: 0.7rem;
  font-weight: bold;
  fill: var(--color-green-infra-base);
  text-anchor: middle;
  alignment-baseline: middle;
}

@keyframes progress {
  0% {
    stroke-dasharray: 0, 100;
  }
}
</style>
