<template>
  <FontAwesomeIcon class="power-state-icon" :class="className" :icon="icon" />
</template>

<script lang="ts" setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
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
  state: PowerState;
}>();

const icons = {
  Running: faPlay,
  Paused: faPause,
  Suspended: faMoon,
  Halted: faStop,
};

const icon = computed(() => icons[props.state] ?? faQuestion);

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
