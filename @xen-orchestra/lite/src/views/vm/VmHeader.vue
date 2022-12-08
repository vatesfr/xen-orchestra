<template>
  <TitleBar :icon="faDisplay">
    {{ name }}
    <template #actions>
      <AppMenu horizontal>
        <MenuItem :icon="faPowerOff" color="info">
          {{ $t("change-state") }}
          <template #submenu>
            <MenuItem
              :busy="isBusy('start')"
              :icon="faPlay"
              :disabled="!isHalted"
              @click="start"
              >{{ $t("start") }}</MenuItem
            >
            <MenuItem
              :busy="isBusy('start_on')"
              :icon="faServer"
              :disabled="!isHalted"
              >{{ $t("start-on-host") }}
              <template #submenu>
                <MenuItem
                  v-for="host in hostStore.allRecords"
                  @click="startOn(host.$ref)"
                  v-bind:key="host.$ref"
                  :icon="faServer"
                >
                  <div class="wrapper">
                    {{ host.name_label }}
                    <div>
                      <UiIcon
                        class="star"
                        :icon="
                          host.$ref === poolStore.pool?.master
                            ? faStar
                            : undefined
                        "
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
              :busy="isBusy('pause')"
              :icon="faPause"
              :disabled="!isRunning"
              @click="pause"
              >{{ $t("pause") }}</MenuItem
            >
            <MenuItem
              :busy="isBusy('suspend')"
              :icon="faMoon"
              :disabled="!isRunning"
              @click="suspend"
              >{{ $t("suspend") }}</MenuItem
            >
            <!-- TODO: update the icon once Clémence has integrated the action into figma -->
            <MenuItem
              :busy="isBusy('unpause') || isBusy('resume')"
              :icon="faCirclePlay"
              :disabled="!isSuspended && !isPaused"
              @click="resume"
              >{{ $t("resume") }}</MenuItem
            >
            <MenuItem
              :busy="isBusy('clean_reboot')"
              :icon="faRotateLeft"
              :disabled="!isRunning"
              @click="reboot"
              >{{ $t("reboot") }}</MenuItem
            >
            <MenuItem
              :busy="isBusy('hard_reboot')"
              :icon="faRepeat"
              :disabled="!isRunning && !isPaused"
              @click="reboot(true)"
              >{{ $t("force-reboot") }}</MenuItem
            >
            <MenuItem
              :busy="isBusy('clean_shutdown')"
              :icon="faPowerOff"
              :disabled="!isRunning"
              @click="shutdown"
              >{{ $t("shutdown") }}</MenuItem
            >
            <MenuItem
              :busy="isBusy('hard_shutdown')"
              :icon="faPlug"
              :disabled="!isRunning && !isSuspended && !isPaused"
              @click="shutdown(true)"
              >{{ $t("force-shutdown") }}</MenuItem
            >
          </template>
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
import UiIcon from "@/components/ui/UiIcon.vue";
import { isHostRunning } from "@/libs/utils";
import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useVmStore } from "@/stores/vm.store";
import {
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
