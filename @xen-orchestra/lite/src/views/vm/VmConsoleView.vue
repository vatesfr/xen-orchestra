<template>
  <div v-if="!isReady">Loading...</div>
  <div v-else-if="!isVmRunning">Console is only available for running VMs.</div>
  <RemoteConsole
    v-else-if="vm && vmConsole"
    :location="vmConsole.location"
    :is-console-available="!isOperationsPending(vm, STOP_OPERATIONS)"
  />
</template>

<script lang="ts" setup>
import { POWER_STATE, VM_OPERATION, type XenApiVm } from "@/libs/xen-api";
import { computed } from "vue";
import { useRoute } from "vue-router";
import RemoteConsole from "@/components/RemoteConsole.vue";
import { useConsoleStore } from "@/stores/console.store";
import { useVmStore } from "@/stores/vm.store";
import { isOperationsPending } from "@/libs/utils";

const STOP_OPERATIONS = [
  VM_OPERATION.SHUTDOWN,
  VM_OPERATION.CLEAN_SHUTDOWN,
  VM_OPERATION.HARD_SHUTDOWN,
  VM_OPERATION.CLEAN_REBOOT,
  VM_OPERATION.HARD_REBOOT,
  VM_OPERATION.PAUSE,
  VM_OPERATION.SUSPEND,
];

const route = useRoute();

const { isReady: isVmReady, getByUuid: getVmByUuid } = useVmStore().subscribe();

const { isReady: isConsoleReady, getByOpaqueRef: getConsoleByOpaqueRef } =
  useConsoleStore().subscribe();

const isReady = computed(() => isVmReady.value && isConsoleReady.value);

const vm = computed(() => getVmByUuid(route.params.uuid as XenApiVm["uuid"]));

const isVmRunning = computed(
  () => vm.value?.power_state === POWER_STATE.RUNNING
);

const vmConsole = computed(() => {
  const consoleOpaqueRef = vm.value?.consoles[0];

  if (consoleOpaqueRef === undefined) {
    return;
  }

  return getConsoleByOpaqueRef(consoleOpaqueRef);
});
</script>
