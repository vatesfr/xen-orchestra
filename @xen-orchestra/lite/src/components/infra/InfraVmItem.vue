<template>
  <li ref="rootElement" class="infra-vm-item">
    <InfraItemLabel
      v-if="isVisible"
      :icon="faDisplay"
      :route="{ name: 'vm.console', params: { uuid: vm.uuid } }"
    >
      {{ vm.name_label }}
      <template #actions>
        <InfraAction :class="powerStateClass" :icon="powerStateIcon" />
      </template>
    </InfraItemLabel>
  </li>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import {
  faDisplay,
  faMoon,
  faPause,
  faPlay,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { useIntersectionObserver } from "@vueuse/core";
import InfraAction from "@/components/infra/InfraAction.vue";
import InfraItemLabel from "@/components/infra/InfraItemLabel.vue";
import { useVmStore } from "@/stores/vm.store";

const props = defineProps<{
  vmOpaqueRef: string;
}>();

const rootElement = ref();
const isVisible = ref(false);

const { stop } = useIntersectionObserver(rootElement, ([entry]) => {
  if (entry.isIntersecting) {
    isVisible.value = true;
    stop();
  }
});

const vmStore = useVmStore();

const vm = computed(() => vmStore.getRecord(props.vmOpaqueRef));

const powerStateIcon = computed(() => {
  switch (vm.value?.power_state) {
    case "Running":
      return faPlay;
    case "Paused":
      return faPause;
    case "Suspended":
      return faMoon;
    default:
      return faStop;
  }
});

const powerStateClass = computed(() =>
  vm.value?.power_state.toLocaleLowerCase()
);
</script>

<style lang="postcss" scoped>
.infra-vm-item {
  height: 6rem;
}

.infra-action {
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
