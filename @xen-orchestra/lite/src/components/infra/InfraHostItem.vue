<template>
  <li v-if="host !== undefined" class="infra-host-item">
    <InfraItemLabel
      :active="isCurrentHost"
      :icon="faServer"
      :route="{ name: 'host.dashboard', params: { uuid: host.uuid } }"
    >
      <span class="host-item">
        <p>{{ host.name_label || "(Host)" }}</p>
        <p class="vm-count">{{ $t("vm-count", { n: vmCount }) }}</p>
      </span>
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
import { useHostCollection } from "@/stores/xen-api/host.store";
import { usePoolCollection } from "@/stores/xen-api/pool.store";
import { vTooltip } from "@/directives/tooltip.directive";
import type { XenApiHost } from "@/libs/xen-api/xen-api.types";
import { useUiStore } from "@/stores/ui.store";
import {
  faAngleDown,
  faAngleUp,
  faServer,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { useToggle } from "@vueuse/core";
import { computed } from "vue";
import { useVmCollection } from "@/stores/xen-api/vm.store";

const props = defineProps<{
  hostOpaqueRef: XenApiHost["$ref"];
}>();

const { getByOpaqueRef } = useHostCollection();
const host = computed(() => getByOpaqueRef(props.hostOpaqueRef));

const { pool } = usePoolCollection();
const isPoolMaster = computed(() => pool.value?.master === props.hostOpaqueRef);

const uiStore = useUiStore();

const isCurrentHost = computed(
  () => props.hostOpaqueRef === uiStore.currentHostOpaqueRef
);
const [isExpanded, toggle] = useToggle(true);

const { recordsByHostRef } = useVmCollection();

const vmCount = computed(() => {
  const vms = recordsByHostRef.value.get(props.hostOpaqueRef);
  return vms?.length;
});
</script>

<style lang="postcss" scoped>
.infra-host-item:deep(.link),
.infra-host-item:deep(.link-placeholder) {
  display: flex;
  align-content: baseline;
  padding-left: 2rem;
}

.infra-vm-list:deep(.link),
.infra-vm-list:deep(.link-placeholder) {
  padding-left: 3rem;
}

.master-icon {
  color: var(--color-orange-world-base);
}

.host-item {
  display: flex;
  flex-direction: column;
}

.vm-count {
  font-style: italic;
  font-size: smaller;
  color: var(--color-blue-scale-200);
}
</style>
