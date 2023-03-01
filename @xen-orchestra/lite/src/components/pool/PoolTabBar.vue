<template>
  <UiTabBar :disabled="!isReady">
    <RouterTab :to="{ name: 'pool.dashboard', params: { uuid: poolUuid } }">
      {{ $t("dashboard") }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.alarms', params: { uuid: poolUuid } }">
      {{ $t("alarms") }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.stats', params: { uuid: poolUuid } }">
      {{ $t("stats") }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.system', params: { uuid: poolUuid } }">
      {{ $t("system") }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.network', params: { uuid: poolUuid } }">
      {{ $t("network") }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.storage', params: { uuid: poolUuid } }">
      {{ $t("storage") }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.tasks', params: { uuid: poolUuid } }">
      {{ $t("tasks") }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.hosts', params: { uuid: poolUuid } }">
      {{ $t("hosts") }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.vms', params: { uuid: poolUuid } }">
      {{ $t("vms") }}
    </RouterTab>
  </UiTabBar>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import RouterTab from "@/components/RouterTab.vue";
import UiTabBar from "@/components/ui/UiTabBar.vue";
import { usePoolStore } from "@/stores/pool.store";

const poolStore = usePoolStore();
const { pool, isReady } = storeToRefs(poolStore);
const poolUuid = computed(() => pool.value?.uuid);
</script>
