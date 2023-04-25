<template>
  <TitleBar :icon="faDisplay">
    {{ name }}
    <template #actions>
      <AppMenu v-if="vm !== undefined" placement="bottom-end" shadow>
        <template #trigger="{ open, isOpen }">
          <UiButton :active="isOpen" :icon="faPowerOff" @click="open">
            {{ $t("change-state") }}
            <UiIcon :icon="faAngleDown" />
          </UiButton>
        </template>
        <MenuItem
          :busy="isOperationsPending(vm, 'start')"
          :disabled="!isHalted"
          :icon="faPlay"
          @click="xenApi.vm.start(vm!.$ref)"
        >
          {{ $t("start") }}
        </MenuItem>
        <MenuItem
          :busy="isOperationsPending(vm, 'start_on')"
          :disabled="!isHalted"
          :icon="faServer"
        >
          {{ $t("start-on-host") }}
          <template #submenu>
            <MenuItem
              v-for="host in hosts as XenApiHost[]"
              v-bind:key="host.$ref"
              :icon="faServer"
              @click="xenApi.vm.startOn(vm!.$ref, host.$ref)"
            >
              <div class="wrapper">
                {{ host.name_label }}
                <div>
                  <UiIcon
                    :icon="host.$ref === pool?.master ? faStar : undefined"
                    class="star"
                  />
                  <PowerStateIcon
                    :state="
                      isHostRunning(host, hostMetricsSubscription)
                        ? 'Running'
                        : 'Halted'
                    "
                  />
                </div>
              </div>
            </MenuItem>
          </template>
        </MenuItem>
        <MenuItem
          :busy="isOperationsPending(vm, 'pause')"
          :disabled="!isRunning"
          :icon="faPause"
          @click="xenApi.vm.pause(vm!.$ref)"
        >
          {{ $t("pause") }}
        </MenuItem>
        <MenuItem
          :busy="isOperationsPending(vm, 'suspend')"
          :disabled="!isRunning"
          :icon="faMoon"
          @click="xenApi.vm.suspend(vm!.$ref)"
        >
          {{ $t("suspend") }}
        </MenuItem>
        <!-- TODO: update the icon once Clémence has integrated the action into figma -->
        <MenuItem
          :busy="isOperationsPending(vm, ['unpause', 'resume'])"
          :disabled="!isSuspended && !isPaused"
          :icon="faCirclePlay"
          @click="xenApi.vm.resume({ [vm!.$ref]: vm!.power_state })"
        >
          {{ $t("resume") }}
        </MenuItem>
        <MenuItem
          :busy="isOperationsPending(vm, 'clean_reboot')"
          :disabled="!isRunning"
          :icon="faRotateLeft"
          @click="xenApi.vm.reboot(vm!.$ref)"
        >
          {{ $t("reboot") }}
        </MenuItem>
        <MenuItem
          :busy="isOperationsPending(vm, 'hard_reboot')"
          :disabled="!isRunning && !isPaused"
          :icon="faRepeat"
          @click="xenApi.vm.reboot(vm!.$ref, true)"
        >
          {{ $t("force-reboot") }}
        </MenuItem>
        <MenuItem
          :busy="isOperationsPending(vm, 'clean_shutdown')"
          :disabled="!isRunning"
          :icon="faPowerOff"
          @click="xenApi.vm.shutdown(vm!.$ref)"
        >
          {{ $t("shutdown") }}
        </MenuItem>
        <MenuItem
          :busy="isOperationsPending(vm, 'hard_shutdown')"
          :disabled="!isRunning && !isSuspended && !isPaused"
          :icon="faPlug"
          @click="xenApi.vm.shutdown(vm!.$ref, true)"
        >
          {{ $t("force-shutdown") }}
        </MenuItem>
      </AppMenu>
    </template>
  </TitleBar>
</template>

<script lang="ts" setup>
import AppMenu from "@/components/menu/AppMenu.vue";
import MenuItem from "@/components/menu/MenuItem.vue";
import PowerStateIcon from "@/components/PowerStateIcon.vue";
import TitleBar from "@/components/TitleBar.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { isHostRunning, isOperationsPending } from "@/libs/utils";
import type { XenApiHost } from "@/libs/xen-api";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useVmStore } from "@/stores/vm.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import {
  faAngleDown,
  faCirclePlay,
  faDisplay,
  faMoon,
  faPause,
  faPlay,
  faPlug,
  faPowerOff,
  faRepeat,
  faRotateLeft,
  faServer,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";
import { useRouter } from "vue-router";

const { getByUuid: getVmByUuid } = useVmStore().subscribe();
const { records: hosts } = useHostStore().subscribe();
const { pool } = usePoolStore().subscribe();
const hostMetricsSubscription = useHostMetricsStore().subscribe();
const xenApi = useXenApiStore().getXapi();
const { currentRoute } = useRouter();

const vm = computed(() =>
  getVmByUuid(currentRoute.value.params.uuid as string)
);

const name = computed(() => vm.value?.name_label);
const isRunning = computed(() => vm.value?.power_state === "Running");
const isHalted = computed(() => vm.value?.power_state === "Halted");
const isSuspended = computed(() => vm.value?.power_state === "Suspended");
const isPaused = computed(() => vm.value?.power_state === "Paused");
</script>

<style lang="postcss" scoped>
.star {
  margin: 0 1rem;
  color: var(--color-orange-world-base);
}

.wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
