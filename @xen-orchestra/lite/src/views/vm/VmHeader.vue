<template>
  <TitleBar :icon="faDisplay">
    {{ name }}
    <template #actions>
      <AppMenu horizontal>
        <MenuItem :icon="faPowerOff" color="info">
          {{ $t("change-state") }}
          <template #submenu>
            <MenuItem :icon="faPlay" :disabled="!isHalted">{{
              $t("start")
            }}</MenuItem>
            <MenuItem :icon="faServer" :disabled="!isHalted"
              >{{ $t("start-on-host") }}
              <template #submenu>
                <MenuItem
                  v-for="host in hostStore.allRecords"
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
            <MenuItem :icon="faPause" :disabled="!isRunning">{{
              $t("pause")
            }}</MenuItem>
            <MenuItem :icon="faMoon" :disabled="!isRunning">{{
              $t("suspend")
            }}</MenuItem>
            <!-- TODO: update the icon once Clémence has integrated the action into figma -->
            <MenuItem
              :icon="faCirclePlay"
              :disabled="!isSuspended && !isPaused"
              >{{ $t("resume") }}</MenuItem
            >
            <MenuItem :icon="faRotateLeft" :disabled="!isRunning">{{
              $t("reboot")
            }}</MenuItem>
            <MenuItem :icon="faRepeat" :disabled="!isRunning && !isPaused">{{
              $t("force-reboot")
            }}</MenuItem>
            <MenuItem :icon="faPowerOff" :disabled="!isRunning">{{
              $t("shutdown")
            }}</MenuItem>
            <MenuItem
              :icon="faPlug"
              :disabled="!isRunning && !isSuspended && !isPaused"
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

const vm = computed(() =>
  vmStore.getRecordByUuid(currentRoute.value.params.uuid as string)
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
