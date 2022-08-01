<template>
  <ul class="infra-pool-list">
    <InfraLoadingItem v-if="!isReady" :icon="faBuildings" />
    <li v-else class="infra-pool-item">
      <InfraItemLabel
        :icon="faBuildings"
        :route="{ name: 'pool.dashboard', params: { uuid: pool.uuid } }"
        current
      >
        {{ pool.name_label }}
      </InfraItemLabel>

      <InfraHostList />

      <InfraVmList />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { faBuildings } from "@fortawesome/pro-regular-svg-icons";
import InfraHostList from "@/components/infra/InfraHostList.vue";
import InfraItemLabel from "@/components/infra/InfraItemLabel.vue";
import InfraLoadingItem from "@/components/infra/InfraLoadingItem.vue";
import InfraVmList from "@/components/infra/InfraVmList.vue";
import { usePoolStore } from "@/stores/pool.store";

const poolStore = usePoolStore();
const { pool, isReady } = storeToRefs(poolStore);
</script>

<style lang="postcss" scoped>
.infra-pool-list {
  font-size: 1.6rem;
  font-weight: 500;
}

.infra-vm-list:deep(.link) {
  padding-left: 3rem;
}
</style>
