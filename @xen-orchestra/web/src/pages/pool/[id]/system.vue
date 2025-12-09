<template>
  <VtsStateHero v-if="!isReady" format="card" type="busy" size="medium" />
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
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoServerCollection } from '@/remote-resources/use-xo-server-collection.ts'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import type { XoPool } from '@vates/types'
import { logicAnd } from '@vueuse/math'

defineProps<{ pool: XoPool }>()

const { areServersReady } = useXoServerCollection()
const { areHostsReady } = useXoHostCollection()
const { areNetworksReady } = useXoNetworkCollection()
const { areSrsReady } = useXoSrCollection()

const isReady = logicAnd(areServersReady, areHostsReady, areNetworksReady, areSrsReady)
</script>
