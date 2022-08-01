<template>
  <FontAwesomeIcon class="power-state-icon" :class="className" :icon="icon" />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import {
  faMoon,
  faPause,
  faPlay,
  faQuestion,
  faStop,
} from "@fortawesome/pro-solid-svg-icons";
import FormWidget from "@/components/FormWidget.vue";
import type { PowerState } from "@/libs/xen-api";

const props = defineProps<{
  state: PowerState | "Unknown";
}>();

const icon = computed(() => {
  const icons = {
    Running: faPlay,
    Paused: faPause,
    Suspended: faMoon,
    Unknown: faQuestion,
    Halted: faStop,
  };

  return icons[props.state];
});

const className = computed(() => `state-${props.state.toLocaleLowerCase()}`);
</script>

<style scoped lang="postcss">
.power-state-icon {
  color: var(--color-extra-blue-d60);

  &.state-running {
    color: var(--color-green-infra-base);
  }

  &.state-paused {
    color: var(--color-blue-scale-300);
  }

  &.state-suspended {
    color: var(--color-extra-blue-d20);
  }
}
</style>
