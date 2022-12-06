<template>
  <TabBar>
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.dashboard', params: { uuid: poolUuid } }"
    >
      {{ $t("dashboard") }}
    </TabBarItem>
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.alarms', params: { uuid: poolUuid } }"
    >
      {{ $t("alarms") }}
    </TabBarItem>
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.stats', params: { uuid: poolUuid } }"
    >
      {{ $t("stats") }}
    </TabBarItem>
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.system', params: { uuid: poolUuid } }"
    >
      {{ $t("system") }}
    </TabBarItem>
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.network', params: { uuid: poolUuid } }"
    >
      {{ $t("network") }}
    </TabBarItem>
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.storage', params: { uuid: poolUuid } }"
    >
      {{ $t("storage") }}
    </TabBarItem>
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.tasks', params: { uuid: poolUuid } }"
    >
      {{ $t("tasks") }}
    </TabBarItem>
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.hosts', params: { uuid: poolUuid } }"
    >
      {{ $t("hosts") }}
    </TabBarItem>
    <TabBarItem
      :disabled="!isReady"
      :to="{ name: 'pool.vms', params: { uuid: poolUuid } }"
    >
      {{ $t("vms") }}
    </TabBarItem>
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
