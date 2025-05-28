<template>
  <VtsLoadingHero v-if="!isReady" type="card" />
  <VtsColumns v-else>
    <VtsColumn>
      <PoolGeneralInfo :pool />
      <PoolNetworking :pool />
      <PoolStorageConfiguration :pool />
    </VtsColumn>
    <VtsColumn>
      <PoolManagement :pool />
      <PoolConnections :pool />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import PoolConnections from '@/components/pool/system/PoolConnections.vue'
import PoolGeneralInfo from '@/components/pool/system/PoolGeneralInfo.vue'
import PoolManagement from '@/components/pool/system/PoolManagement.vue'
import PoolNetworking from '@/components/pool/system/PoolNetworking.vue'
import PoolStorageConfiguration from '@/components/pool/system/PoolStorageConfiguration.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import { useSrStore } from '@/stores/xo-rest-api/sr.store'
import type { XoPool } from '@/types/xo/pool.type'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import { logicAnd } from '@vueuse/math'

defineProps<{ pool: XoPool }>()

const { isReady: isServersReady } = useServerStore().subscribe()
const { isReady: isHostsReady } = useHostStore().subscribe()
const { isReady: isNetworksReady } = useNetworkStore().subscribe()
const { isReady: isSrsReady } = useSrStore().subscribe()

const isReady = logicAnd(isServersReady, isHostsReady, isNetworksReady, isSrsReady)
</script>
