<template>
  <li v-if="host" class="infra-host-item">
    <InfraItemLabel
      :current="isCurrentHost"
      :icon="faServer"
      :route="{ name: 'host.dashboard', params: { uuid: host.uuid } }"
    >
      {{ host.name_label }}
      <template #actions>
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
import { faAngleDown, faAngleUp } from "@fortawesome/pro-light-svg-icons";
import { faServer } from "@fortawesome/pro-regular-svg-icons";
import { useToggle } from "@vueuse/core";
import InfraAction from "@/components/infra/InfraAction.vue";
import InfraItemLabel from "@/components/infra/InfraItemLabel.vue";
import InfraVmList from "@/components/infra/InfraVmList.vue";
import { useHostStore } from "@/stores/host.store";
import { useUiStore } from "@/stores/ui.store";

const props = defineProps<{
  hostOpaqueRef: string;
}>();

const hostStore = useHostStore();
const host = computed(() => hostStore.getRecord(props.hostOpaqueRef));

const uiStore = useUiStore();

const isCurrentHost = computed(
  () => props.hostOpaqueRef === uiStore.currentHostOpaqueRef
);
const [isExpanded, toggle] = useToggle();
</script>

<style lang="postcss" scoped>
.infra-host-item:deep(.link) {
  padding-left: 3rem;
}

.infra-vm-list:deep(.link) {
  padding-left: 4.5rem;
}
</style>
