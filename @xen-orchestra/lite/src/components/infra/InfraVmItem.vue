<template>
  <li
    v-if="vm !== undefined"
    ref="rootElement"
    v-tooltip="{
      content: vm.name_label,
      disabled: isTooltipDisabled,
    }"
    class="infra-vm-item"
  >
    <InfraItemLabel
      v-if="isVisible"
      :icon="faDisplay"
      :route="{ name: 'vm.console', params: { uuid: vm.uuid } }"
    >
      {{ vm.name_label || "(VM)" }}
      <template #actions>
        <InfraAction>
          <PowerStateIcon :state="vm.power_state" />
        </InfraAction>
      </template>
    </InfraItemLabel>
  </li>
</template>

<script lang="ts" setup>
import InfraAction from "@/components/infra/InfraAction.vue";
import InfraItemLabel from "@/components/infra/InfraItemLabel.vue";
import PowerStateIcon from "@/components/PowerStateIcon.vue";
import { vTooltip } from "@/directives/tooltip.directive";
import { hasEllipsis } from "@/libs/utils";
import { useVmStore } from "@/stores/vm.store";
import { faDisplay } from "@fortawesome/free-solid-svg-icons";
import { useIntersectionObserver } from "@vueuse/core";
import { computed, ref } from "vue";

const props = defineProps<{
  vmOpaqueRef: string;
}>();

const { getByOpaqueRef } = useVmStore().subscribe();
const vm = computed(() => getByOpaqueRef(props.vmOpaqueRef));
const rootElement = ref();
const isVisible = ref(false);

const { stop } = useIntersectionObserver(rootElement, ([entry]) => {
  if (entry.isIntersecting) {
    isVisible.value = true;
    stop();
  }
});

const isTooltipDisabled = (target: HTMLElement) =>
  !hasEllipsis(target.querySelector(".text"));
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
