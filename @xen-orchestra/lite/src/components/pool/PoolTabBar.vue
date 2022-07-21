<template>
  <TabBar>
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.dashboard', params: { uuid: poolUuid } }"
      >Dashboard</TabBarItem
    >
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.alarms', params: { uuid: poolUuid } }"
      >Alarms</TabBarItem
    >
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.stats', params: { uuid: poolUuid } }"
      >Stats</TabBarItem
    >
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.system', params: { uuid: poolUuid } }"
      >System</TabBarItem
    >
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.network', params: { uuid: poolUuid } }"
      >Network</TabBarItem
    >
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.storage', params: { uuid: poolUuid } }"
      >Storage</TabBarItem
    >
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.tasks', params: { uuid: poolUuid } }"
      >Tasks</TabBarItem
    >
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.hosts', params: { uuid: poolUuid } }"
      >Hosts</TabBarItem
    >
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.vms', params: { uuid: poolUuid } }"
      >VMs</TabBarItem
    >
  </TabBar>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import TabBar from "@/components/TabBar.vue";
import TabBarItem from "@/components/TabBarItem.vue";
import { usePoolStore } from "@/stores/pool.store";

const poolStore = usePoolStore();
const { pool, isReady } = storeToRefs(poolStore);
const poolUuid = computed(() => pool.value?.uuid);
</script>
