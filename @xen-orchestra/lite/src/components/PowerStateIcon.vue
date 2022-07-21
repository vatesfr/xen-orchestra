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
} from "@fortawesome/free-solid-svg-icons";
import type { PowerState } from "@/libs/xen-api";

const props = defineProps<{
  state: PowerState | "Unknown";
}>();

const icon = computed(() => {
  switch (props.state) {
    case "Running":
      return faPlay;
    case "Paused":
      return faPause;
    case "Suspended":
      return faMoon;
    case "Unknown":
      return faQuestion;
    default:
      return faStop;
  }
});

const className = computed(() => props.state.toLocaleLowerCase());
</script>

<style scoped lang="postcss">
.power-state-icon {
  color: var(--color-extra-blue-d60);

  &.running {
    color: var(--color-green-infra-base);
  }

  &.paused {
    color: var(--color-blue-scale-300);
  }

  &.suspended {
    color: var(--color-extra-blue-d20);
  }
}
</style>
