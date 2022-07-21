<template>
  <div v-if="!isReady">Loading...</div>
  <div v-else-if="!isVmRunning">Console is only available for running VMs.</div>
  <RemoteConsole v-else-if="vmConsole" :location="vmConsole.location" />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import RemoteConsole from "@/components/RemoteConsole.vue";
import { useConsoleStore } from "@/stores/console.store";
import { useVmStore } from "@/stores/vm.store";

const route = useRoute();
const vmStore = useVmStore();
const consoleStore = useConsoleStore();

const isReady = computed(() => vmStore.isReady || consoleStore.isReady);

const vm = computed(() => vmStore.getRecordByUuid(route.params.uuid as string));
const isVmRunning = computed(() => vm.value?.power_state === "Running");

const vmConsole = computed(() => {
  const consoleOpaqueRef = vm.value?.consoles[0];

  if (!consoleOpaqueRef) {
    return;
  }

  return consoleStore.getRecord(consoleOpaqueRef);
});
</script>
