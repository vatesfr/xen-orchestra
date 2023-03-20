<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="!isVmRunning">Console is only available for running VMs.</div>
  <RemoteConsole
    v-else-if="vmConsole"
    :location="vmConsole.location"
    :is-console-available="!isOperationsPending(vm, STOP_OPERATIONS)"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import RemoteConsole from "@/components/RemoteConsole.vue";
import { useConsoleStore } from "@/stores/console.store";
import { useVmStore } from "@/stores/vm.store";
import { isOperationsPending } from "@/libs/utils";

const STOP_OPERATIONS = [
  "shutdown",
  "clean_shutdown",
  "hard_shutdown",
  "clean_reboot",
  "hard_reboot",
  "pause",
  "suspend",
];

const route = useRoute();
const vmStore = useVmStore();
const consoleStore = useConsoleStore();

const isLoading = computed(() => vmStore.isLoading && consoleStore.isLoading);

const vm = computed(
  () => vmStore.getRecordByUuid(route.params.uuid as string)!
);
const isVmRunning = computed(() => vm.value?.power_state === "Running");

const vmConsole = computed(() => {
  const consoleOpaqueRef = vm.value?.consoles[0];

  if (!consoleOpaqueRef) {
    return;
  }

  return consoleStore.getRecord(consoleOpaqueRef);
});
</script>
