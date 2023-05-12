<template>
  <div v-if="!isReady">Loading...</div>
  <div v-else-if="!isVmRunning">Console is only available for running VMs.</div>
  <template v-else-if="vm && vmConsole">
    <RemoteConsole
      :is-console-available="!isOperationsPending(vm, STOP_OPERATIONS)"
      :location="vmConsole.location"
      class="remote-console"
    />
    <RouterLink
      v-if="uiStore.hasUi"
      :to="{ query: { ui: '0' } }"
      class="open-link"
      target="_blank"
    >
      <UiIcon :icon="faArrowUpRightFromSquare" />
      Open in new window
    </RouterLink>
  </template>
</template>

<script lang="ts" setup>
import RemoteConsole from "@/components/RemoteConsole.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { isOperationsPending } from "@/libs/utils";
import { useConsoleStore } from "@/stores/console.store";
import { useUiStore } from "@/stores/ui.store";
import { useVmStore } from "@/stores/vm.store";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";
import { useRoute } from "vue-router";

const STOP_OPERATIONS = [
  "shutdown",
  "clean_shutdown",
  "hard_shutdown",
  "clean_reboot",
  "hard_reboot",
  "pause",
  "suspend",
];

const uiStore = useUiStore();
const route = useRoute();

const { isReady: isVmReady, getByUuid: getVmByUuid } = useVmStore().subscribe();

const { isReady: isConsoleReady, getByOpaqueRef: getConsoleByOpaqueRef } =
  useConsoleStore().subscribe();

const isReady = computed(() => isVmReady.value && isConsoleReady.value);

const vm = computed(() => getVmByUuid(route.params.uuid as string));

const isVmRunning = computed(() => vm.value?.power_state === "Running");

const vmConsole = computed(() => {
  const consoleOpaqueRef = vm.value?.consoles[0];

  if (consoleOpaqueRef === undefined) {
    return;
  }

  return getConsoleByOpaqueRef(consoleOpaqueRef);
});
</script>

<style lang="postcss" scoped>
.open-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--color-extra-blue-base);
  color: var(--color-blue-scale-500);
  text-decoration: none;
  padding: 1.5rem;
  font-size: 1.6rem;
  border-radius: 0 0 0 0.8rem;
  position: absolute;
  top: 8rem;
  right: 0;
  white-space: nowrap;
  transform: translateX(calc(100% - 4.5rem));
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateX(0);
  }
}

.remote-console {
  height: calc(100% - 8rem);
}
</style>
