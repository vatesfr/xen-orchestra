<template>
  <div class="vm-console-view">
    <div v-if="hasError">{{ $t("error-occurred") }}</div>
    <UiSpinner v-else-if="!isReady" class="spinner" />
    <div v-else-if="!isVmRunning" class="not-running">
      <div><img alt="" src="@/assets/monitor.svg" /></div>
      {{ $t("power-on-for-console") }}
    </div>
    <div v-else-if="!isConsoleAvailable" class="not-available">
      <div><img alt="" src="@/assets/monitor.svg" /></div>
      {{ $t("console-unavailable") }}
    </div>
    <RemoteConsole
      v-else-if="vm && vmConsole"
      :location="vmConsole.location"
      class="remote-console"
    />
  </div>
</template>

<script lang="ts" setup>
import RemoteConsole from "@/components/RemoteConsole.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import { isOperationsPending } from "@/libs/utils";
import { POWER_STATE, VM_OPERATION, type XenApiVm } from "@/libs/xen-api";
import { useConsoleStore } from "@/stores/console.store";
import { usePageTitleStore } from "@/stores/page-title.store";
import { useVmStore } from "@/stores/vm.store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const STOP_OPERATIONS = [
  VM_OPERATION.SHUTDOWN,
  VM_OPERATION.CLEAN_SHUTDOWN,
  VM_OPERATION.HARD_SHUTDOWN,
  VM_OPERATION.CLEAN_REBOOT,
  VM_OPERATION.HARD_REBOOT,
  VM_OPERATION.PAUSE,
  VM_OPERATION.SUSPEND,
];

usePageTitleStore().setTitle(useI18n().t("console"));

const route = useRoute();

const {
  isReady: isVmReady,
  getByUuid: getVmByUuid,
  hasError: hasVmError,
} = useVmStore().subscribe();

const {
  isReady: isConsoleReady,
  getByOpaqueRef: getConsoleByOpaqueRef,
  hasError: hasConsoleError,
} = useConsoleStore().subscribe();

const isReady = computed(() => isVmReady.value && isConsoleReady.value);

const hasError = computed(() => hasVmError.value || hasConsoleError.value);

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

const isConsoleAvailable = computed(
  () =>
    vm.value !== undefined && !isOperationsPending(vm.value, STOP_OPERATIONS)
);
</script>

<style lang="postcss" scoped>
.vm-console-view {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100% - 14.5rem);
}

.spinner {
  color: var(--color-extra-blue-base);
  display: flex;
  margin: auto;
  width: 10rem;
  height: 10rem;
}

.remote-console {
  flex: 1;
  max-width: 100%;
  height: 100%;
}

.not-running,
.not-available {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  gap: 4rem;
  color: var(--color-extra-blue-base);
  font-size: 3.6rem;
}
</style>
