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
          @click="xenApi.vm.start({ vmRef: vm.$ref })"
          :busy="isOperationsPending(vm, 'start')"
          :disabled="!isHalted"
          :icon="faPlay"
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
              v-for="host in hostStore.allRecords"
              @click="xenApi.vm.startOn({ vmRef: vm.$ref, hostRef: host.$ref })"
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
          @click="xenApi.vm.pause({ vmRef: vm.$ref })"
          :busy="isOperationsPending(vm, 'pause')"
          :disabled="!isRunning"
          :icon="faPause"
        >
          {{ $t("pause") }}
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.suspend({ vmRef: vm.$ref })"
          :busy="isOperationsPending(vm, 'suspend')"
          :disabled="!isRunning"
          :icon="faMoon"
        >
          {{ $t("suspend") }}
        </MenuItem>
        <!-- TODO: update the icon once Clémence has integrated the action into figma -->
        <MenuItem
          @click="
            xenApi.vm.resume({
              vmRef: vm.$ref,
            })
          "
          :busy="isOperationsPending(vm, ['unpause', 'resume'])"
          :disabled="!isSuspended && !isPaused"
          :icon="faCirclePlay"
        >
          {{ $t("resume") }}
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.reboot({ vmRef: vm.$ref })"
          :busy="isOperationsPending(vm, 'clean_reboot')"
          :disabled="!isRunning"
          :icon="faRotateLeft"
        >
          {{ $t("reboot") }}
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.reboot({ vmRef: vm.$ref, force: true })"
          :busy="isOperationsPending(vm, 'hard_reboot')"
          :disabled="!isRunning && !isPaused"
          :icon="faRepeat"
        >
          {{ $t("force-reboot") }}
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.shutdown({ vmRef: vm.$ref })"
          :busy="isOperationsPending(vm, 'clean_shutdown')"
          :disabled="!isRunning"
          :icon="faPowerOff"
        >
          {{ $t("shutdown") }}
        </MenuItem>
        <MenuItem
          @click="xenApi.vm.shutdown({ vmRef: vm.$ref, force: true })"
          :busy="isOperationsPending(vm, 'hard_shutdown')"
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
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { isHostRunning, isOperationsPending } from "@/libs/utils";
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
import { computedAsync } from "@vueuse/core";

const vmStore = useVmStore();
const hostStore = useHostStore();
const poolStore = usePoolStore();
const { currentRoute } = useRouter();

const vm = computed(
  () => vmStore.getRecordByUuid(currentRoute.value.params.uuid as string)!
);
const xenApi = computedAsync(() => useXenApiStore().getXapi());
const name = computed(() => vm.value.name_label);
const isRunning = computed(() => vm.value.power_state === "Running");
const isHalted = computed(() => vm.value.power_state === "Halted");
const isSuspended = computed(() => vm.value.power_state === "Suspended");
const isPaused = computed(() => vm.value.power_state === "Paused");
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
