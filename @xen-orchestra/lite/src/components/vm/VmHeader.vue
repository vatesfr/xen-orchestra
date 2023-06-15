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
        <VmActionPowerStateItems :vm-refs="[vm.$ref]" />
      </AppMenu>
    </template>
  </TitleBar>
</template>

<script lang="ts" setup>
import AppMenu from "@/components/menu/AppMenu.vue";
import TitleBar from "@/components/TitleBar.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { useVmStore } from "@/stores/vm.store";
import VmActionPowerStateItems from "@/components/vm/VmActionItems/VmActionPowerStateItems.vue";
import type { XenApiVm } from "@/libs/xen-api";
import {
  faAngleDown,
  faDisplay,
  faPowerOff,
} from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";
import { useRouter } from "vue-router";

const { getByUuid: getVmByUuid } = useVmStore().subscribe();
const { currentRoute } = useRouter();

const vm = computed(() =>
  getVmByUuid(currentRoute.value.params.uuid as XenApiVm["uuid"])
);

const name = computed(() => vm.value?.name_label);
</script>
