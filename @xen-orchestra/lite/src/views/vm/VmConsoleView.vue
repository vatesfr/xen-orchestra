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
