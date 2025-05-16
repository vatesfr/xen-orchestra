<template>
  <div v-if="isReady" class="system" :class="{ mobile: uiStore.isMobile }">
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
  <VtsLoadingHero v-else type="card" />
</template>

<script setup lang="ts">
import PoolConnections from '@/components/pool/system/PoolConnections.vue'
import PoolGeneralInfo from '@/components/pool/system/PoolGeneralInfo.vue'
import PoolLicensing from '@/components/pool/system/PoolLicensing.vue'
import PoolManagement from '@/components/pool/system/PoolManagement.vue'
import PoolNetworking from '@/components/pool/system/PoolNetworking.vue'
import PoolResourceManagement from '@/components/pool/system/PoolResourceManagement.vue'
import PoolStorageConfiguration from '@/components/pool/system/PoolStorageConfiguration.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import { useSrStore } from '@/stores/xo-rest-api/sr.store'
import type { XoPool } from '@/types/xo/pool.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import { useUiStore } from '@core/stores/ui.store'
import { logicAnd } from '@vueuse/math'

defineProps<{ pool: XoPool }>()

const uiStore = useUiStore()

const { isReady: isServersReady } = useServerStore().subscribe()
const { isReady: isHostsReady } = useHostStore().subscribe()
const { isReady: isNetworksReady } = useNetworkStore().subscribe()
const { isReady: isSrsReady } = useSrStore().subscribe()

const isReady = logicAnd(isServersReady, isHostsReady, isNetworksReady, isSrsReady)
</script>

<style scoped lang="postcss">
.system {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
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
