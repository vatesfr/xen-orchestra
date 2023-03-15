<template>
  <li
    v-if="host"
    class="infra-host-item"
    v-tooltip="{
      content: host.name_label,
      disabled: isTooltipDisabled,
    }"
  >
    <InfraItemLabel
      :active="isCurrentHost"
      :icon="faServer"
      :route="{ name: 'host.dashboard', params: { uuid: host.uuid } }"
    >
      {{ host.name_label || "(Host)" }}
      <template #actions>
        <InfraAction
          :icon="faStar"
          class="master-icon"
          v-if="isPoolMaster"
          v-tooltip="'Master'"
        />
        <InfraAction
          :icon="isExpanded ? faAngleDown : faAngleUp"
          @click="toggle()"
        />
      </template>
    </InfraItemLabel>

    <InfraVmList v-show="isExpanded" :host-opaque-ref="hostOpaqueRef" />
  </li>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { vTooltip } from "@/directives/tooltip.directive";
import {
  faAngleDown,
  faAngleUp,
  faServer,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { useToggle } from "@vueuse/core";
import InfraAction from "@/components/infra/InfraAction.vue";
import InfraItemLabel from "@/components/infra/InfraItemLabel.vue";
import InfraVmList from "@/components/infra/InfraVmList.vue";
import { hasEllipsis } from "@/libs/utils";
import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useUiStore } from "@/stores/ui.store";

const props = defineProps<{
  hostOpaqueRef: string;
}>();

const hostStore = useHostStore();
const host = computed(() => hostStore.getRecord(props.hostOpaqueRef));

const poolStore = usePoolStore();
const isPoolMaster = computed(
  () => poolStore.pool?.master === props.hostOpaqueRef
);

const uiStore = useUiStore();

const isCurrentHost = computed(
  () => props.hostOpaqueRef === uiStore.currentHostOpaqueRef
);
const [isExpanded, toggle] = useToggle(true);

const isTooltipDisabled = (target: HTMLElement) =>
  !hasEllipsis(target.querySelector(".text"));
</script>

<style lang="postcss" scoped>
.infra-host-item:deep(.link) {
  padding-left: 3rem;
}

.infra-vm-list:deep(.link) {
  padding-left: 4.5rem;
}

.master-icon {
  color: var(--color-orange-world-base);
}
</style>
