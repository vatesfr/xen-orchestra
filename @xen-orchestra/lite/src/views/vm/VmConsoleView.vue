<template>
  <div :class="{ 'no-ui': !uiStore.hasUi }" class="vm-console-view">
    <div v-if="hasError">{{ $t("error-occurred") }}</div>
    <UiSpinner v-else-if="!isReady" class="spinner" />
    <div v-else-if="!isVmRunning" class="not-running">
      <div><img alt="" src="@/assets/monitor.svg" /></div>
      {{ $t("power-on-for-console") }}
    </div>
    <template v-else-if="vm && vmConsole">
      <AppMenu horizontal>
        <MenuItem
          :icon="faArrowUpRightFromSquare"
          @click="openInNewTab"
          v-if="uiStore.hasUi"
        >
          {{ $t("open-console-in-new-tab") }}
        </MenuItem>
        <MenuItem
          :icon="
            uiStore.hasUi
              ? faUpRightAndDownLeftFromCenter
              : faDownLeftAndUpRightToCenter
          "
          @click="toggleFullScreen"
        >
          {{ $t(uiStore.hasUi ? "fullscreen" : "fullscreen-leave") }}
        </MenuItem>
        <MenuItem
          :disabled="!consoleElement"
          :icon="faKeyboard"
          @click="sendCtrlAltDel"
        >
          {{ $t("send-ctrl-alt-del") }}
        </MenuItem>
      </AppMenu>
      <RemoteConsole
        ref="consoleElement"
        :is-console-available="isConsoleAvailable"
        :location="vmConsole.location"
        class="remote-console"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import AppMenu from "@/components/menu/AppMenu.vue";
import MenuItem from "@/components/menu/MenuItem.vue";
import RemoteConsole from "@/components/RemoteConsole.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import { getFirst } from "@/libs/utils";
import { VM_OPERATION, VM_POWER_STATE } from "@/libs/xen-api/xen-api.enums";
import type { XenApiVm } from "@/libs/xen-api/xen-api.types";
import { usePageTitleStore } from "@/stores/page-title.store";
import { useUiStore } from "@/stores/ui.store";
import { useConsoleCollection } from "@/stores/xen-api/console.store";
import { useVmCollection } from "@/stores/xen-api/vm.store";
import {
  faArrowUpRightFromSquare,
  faDownLeftAndUpRightToCenter,
  faKeyboard,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

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

const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();

const {
  isReady: isVmReady,
  getByUuid: getVmByUuid,
  hasError: hasVmError,
  isOperationPending,
} = useVmCollection();

const {
  isReady: isConsoleReady,
  getByOpaqueRef: getConsoleByOpaqueRef,
  hasError: hasConsoleError,
} = useConsoleCollection();

const isReady = computed(() => isVmReady.value && isConsoleReady.value);

const hasError = computed(() => hasVmError.value || hasConsoleError.value);

const vm = computed(() => getVmByUuid(route.params.uuid as XenApiVm["uuid"]));

const isVmRunning = computed(
  () => vm.value?.power_state === VM_POWER_STATE.RUNNING
);

const vmConsole = computed(() => {
  const consoleOpaqueRef = vm.value?.consoles[0];

  if (consoleOpaqueRef === undefined) {
    return;
  }

  return getConsoleByOpaqueRef(consoleOpaqueRef);
});

const isConsoleAvailable = computed(() =>
  vm.value !== undefined
    ? !isOperationPending(vm.value, STOP_OPERATIONS)
    : false
);

const consoleElement = ref();

const sendCtrlAltDel = () => consoleElement.value?.sendCtrlAltDel();

const toggleFullScreen = () => {
  uiStore.hasUi = !uiStore.hasUi;
};

const openInNewTab = () => {
  const externalMaster = getFirst(route.query["master"]);
  const query: { ui: string; master?: string } = { ui: "0" };
  if (externalMaster != undefined) {
    query["master"] = externalMaster;
  }
  const routeData = router.resolve({ query });
  window.open(routeData.href, "_blank");
};
</script>

<style lang="postcss" scoped>
.vm-console-view {
  display: flex;
  height: calc(100% - 14.5rem);
  flex-direction: column;

  &.no-ui {
    height: 100%;
  }
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

.open-in-new-window {
  position: absolute;
  top: 0;
  right: 0;
  overflow: hidden;

  & > .link {
    display: flex;
    align-items: center;
    gap: 1rem;
    background-color: var(--color-extra-blue-base);
    color: var(--color-blue-scale-500);
    text-decoration: none;
    padding: 1.5rem;
    font-size: 1.6rem;
    border-radius: 0 0 0 0.8rem;
    white-space: nowrap;
    transform: translateX(calc(100% - 4.5rem));
    transition: transform 0.2s ease-in-out;

    &:hover {
      transform: translateX(0);
    }
  }
}

.vm-console-view:deep(.app-menu) {
  background-color: transparent;
  align-self: center;
}
</style>
