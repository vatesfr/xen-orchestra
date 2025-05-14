<template>
  <div class="system" :class="{ mobile: uiStore.isMobile }">
    <div class="column">
      <PoolGeneralInfo :pool />
      <PoolNetworking :pool />
      <PoolStorageConfiguration :pool />
      <PoolResourceManagement />
    </div>
    <div class="column">
      <PoolLicensing />
      <PoolManagement :pool />
      <PoolConnections :pool />
    </div>
  </div>
</template>

<script setup lang="ts">
import PoolConnections from '@/components/pool/system/PoolConnections.vue'
import PoolGeneralInfo from '@/components/pool/system/PoolGeneralInfo.vue'
import PoolLicensing from '@/components/pool/system/PoolLicensing.vue'
import PoolManagement from '@/components/pool/system/PoolManagement.vue'
import PoolNetworking from '@/components/pool/system/PoolNetworking.vue'
import PoolResourceManagement from '@/components/pool/system/PoolResourceManagement.vue'
import PoolStorageConfiguration from '@/components/pool/system/PoolStorageConfiguration.vue'
import type { XoPool } from '@/types/xo/pool.type'
import { useUiStore } from '@core/stores/ui.store'

defineProps<{ pool: XoPool }>()

const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.system {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  width: 100%;
  flex-direction: row;

  .column {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 50%;
  }

  &.mobile {
    flex-direction: column;

    .column {
      width: 100%;
    }
  }
}
</style>
