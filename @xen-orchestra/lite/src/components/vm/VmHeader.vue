<template>
  <TitleBar :icon="faDisplay">
    {{ name }}
    <template #actions>
      <AppMenu shadow placement="bottom-end">
        <template #trigger="{ open, isOpen }">
          <UiButton :active="isOpen" :icon="faPowerOff" @click="open">
            {{ $t("change-state") }}
            <UiIcon :icon="faAngleDown" />
          </UiButton>
        </template>
        <MenuItem
          @click="start"
          :busy="isBusy('start')"
          :disabled="!isHalted"
          :icon="faPlay"
        >
          {{ $t("start") }}
        </MenuItem>
        <MenuItem :disabled="!isHalted" :icon="faServer">
          {{ $t("start-on-host") }}
          <template #submenu>
            <MenuItem
              v-for="host in hostStore.allRecords"
              @click="startOn(host.$ref)"
              :busy="isBusy('start_on')"
              v-bind:key="host.$ref"
              :icon="faServer"
            >
              <div class="wrapper">
                {{ host.name_label }}
                <div>
                  <UiIcon
                    :icon="
                      host.$ref === poolStore.pool?.master ? faStar : undefined
                    "
                    class="star"
                  />
                  <PowerStateIcon
                    :state="isHostRunning(host) ? 'Running' : 'Halted'"
                  />
                </div>
              </div>
            </MenuItem>
          </template>
        </MenuItem>
        <MenuItem
          @click="pause"
          :busy="isBusy('pause')"
          :disabled="!isRunning"
          :icon="faPause"
        >
          {{ $t("pause") }}
        </MenuItem>
        <MenuItem
          @click="suspend"
          :busy="isBusy('suspend')"
          :disabled="!isRunning"
          :icon="faMoon"
        >
          {{ $t("suspend") }}
        </MenuItem>
        <!-- TODO: update the icon once Clémence has integrated the action into figma -->
        <MenuItem
          @click="resume"
          :busy="isBusy('unpause') || isBusy('resume')"
          :disabled="!isSuspended && !isPaused"
          :icon="faCirclePlay"
        >
          {{ $t("resume") }}
        </MenuItem>
        <MenuItem
          @click="reboot"
          :busy="isBusy('clean_reboot')"
          :disabled="!isRunning"
          :icon="faRotateLeft"
        >
          {{ $t("reboot") }}
        </MenuItem>
        <MenuItem
          @click="reboot(true)"
          :busy="isBusy('hard_reboot')"
          :disabled="!isRunning && !isPaused"
          :icon="faRepeat"
        >
          {{ $t("force-reboot") }}
        </MenuItem>
        <MenuItem
          @click="shutdown"
          :busy="isBusy('clean_shutdown')"
          :disabled="!isRunning"
          :icon="faPowerOff"
        >
          {{ $t("shutdown") }}
        </MenuItem>
        <MenuItem
          @click="shutdown(true)"
          :busy="isBusy('hard_shutdown')"
          :disabled="!isRunning && !isSuspended && !isPaused"
          :icon="faPlug"
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
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import { isHostRunning } from "@/libs/utils";
import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useVmStore } from "@/stores/vm.store";
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

const vmStore = useVmStore();
const hostStore = useHostStore();
const poolStore = usePoolStore();
const { currentRoute } = useRouter();

const isBusy = (operation: string) =>
  Object.values(vm.value.current_operations).includes(operation);
const vm = computed(
  () => vmStore.getRecordByUuid(currentRoute.value.params.uuid as string)!
);
const name = computed(() => vm.value.name_label);
const isRunning = computed(() => vm.value.power_state === "Running");
const isHalted = computed(() => vm.value.power_state === "Halted");
const isSuspended = computed(() => vm.value.power_state === "Suspended");
const isPaused = computed(
  () =>
    vm.value.power_state === "Paused" &&
    !(isBusy("clean_shutdown") || isBusy("hard_shutdown"))
);
const start = () => vmStore.start([vm.value.$ref]);
const startOn = (hostRef: string) => vmStore.startOn([vm.value.$ref], hostRef);
const pause = () => vmStore.pause([vm.value.$ref]);
const suspend = () => vmStore.suspend([vm.value.$ref]);
const resume = () => vmStore.resume([[vm.value.$ref, vm.value.power_state]]);
const reboot = (force?: boolean) => vmStore.reboot([vm.value.$ref], force);
const shutdown = (force?: boolean) => vmStore.shutdown([vm.value.$ref], force);
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
