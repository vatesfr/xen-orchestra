<template>
  <UiIcon :class="className" :icon="icon" class="power-state-icon" />
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { VM_POWER_STATE } from "@/libs/xen-api/xen-api.enums";
import {
  faMoon,
  faPause,
  faPlay,
  faQuestion,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";

const props = defineProps<{
  state: VM_POWER_STATE;
}>();

const icons = {
  [VM_POWER_STATE.RUNNING]: faPlay,
  [VM_POWER_STATE.PAUSED]: faPause,
  [VM_POWER_STATE.SUSPENDED]: faMoon,
  [VM_POWER_STATE.HALTED]: faStop,
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
