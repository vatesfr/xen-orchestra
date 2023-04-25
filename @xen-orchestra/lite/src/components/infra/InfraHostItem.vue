<template>
  <li
    v-if="host !== undefined"
    v-tooltip="{
      content: host.name_label,
      disabled: isTooltipDisabled,
    }"
    class="infra-host-item"
  >
    <InfraItemLabel
      :active="isCurrentHost"
      :icon="faServer"
      :route="{ name: 'host.dashboard', params: { uuid: host.uuid } }"
    >
      {{ host.name_label || "(Host)" }}
      <template #actions>
        <InfraAction
          v-if="isPoolMaster"
          v-tooltip="'Master'"
          :icon="faStar"
          class="master-icon"
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
import InfraAction from "@/components/infra/InfraAction.vue";
import InfraItemLabel from "@/components/infra/InfraItemLabel.vue";
import InfraVmList from "@/components/infra/InfraVmList.vue";
import { vTooltip } from "@/directives/tooltip.directive";
import { hasEllipsis } from "@/libs/utils";
import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useUiStore } from "@/stores/ui.store";
import {
  faAngleDown,
  faAngleUp,
  faServer,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { useToggle } from "@vueuse/core";
import { computed } from "vue";

const props = defineProps<{
  hostOpaqueRef: string;
}>();

const { getByOpaqueRef } = useHostStore().subscribe();
const host = computed(() => getByOpaqueRef(props.hostOpaqueRef));

const { pool } = usePoolStore().subscribe();

const isPoolMaster = computed(() => pool.value?.master === props.hostOpaqueRef);

const uiStore = useUiStore();

const isCurrentHost = computed(
  () => props.hostOpaqueRef === uiStore.currentHostOpaqueRef
);
const [isExpanded, toggle] = useToggle(true);

const isTooltipDisabled = (target: HTMLElement) =>
  !hasEllipsis(target.querySelector(".text"));
</script>

<style lang="postcss" scoped>
.infra-host-item:deep(.link),
.infra-host-item:deep(.link-placeholder) {
  padding-left: 3rem;
}

.infra-vm-list:deep(.link),
.infra-vm-list:deep(.link-placeholder) {
  padding-left: 4.5rem;
}

.master-icon {
  color: var(--color-orange-world-base);
}
</style>
