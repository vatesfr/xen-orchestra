<template>
  <UiIcon :class="className" :icon="icon" class="power-state-icon" />
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { POWER_STATE } from "@/libs/xen-api/xen-api.utils";
import {
  faMoon,
  faPause,
  faPlay,
  faQuestion,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";

const props = defineProps<{
  state: POWER_STATE;
}>();

const icons = {
  [POWER_STATE.RUNNING]: faPlay,
  [POWER_STATE.PAUSED]: faPause,
  [POWER_STATE.SUSPENDED]: faMoon,
  [POWER_STATE.HALTED]: faStop,
};

const icon = computed(() => icons[props.state] ?? faQuestion);

const className = computed(() => `state-${props.state.toLocaleLowerCase()}`);
</script>

<style lang="postcss" scoped>
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
