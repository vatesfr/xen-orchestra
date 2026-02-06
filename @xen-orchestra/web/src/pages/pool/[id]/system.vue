<template>
  <VtsStateHero v-if="!isReady" format="card" type="busy" size="medium" />
  <VtsColumns v-else>
    <VtsColumn>
      <PoolSystemGeneralInfo :pool />
      <PoolSystemNetworking :pool />
      <PoolSystemStorageConfiguration :pool />
    </VtsColumn>
    <VtsColumn>
      <PoolSystemManagement :pool />
      <PoolSystemConnections :pool />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import PoolSystemConnections from '@/modules/pool/components/system/PoolSystemConnections.vue'
import PoolSystemGeneralInfo from '@/modules/pool/components/system/PoolSystemGeneralInfo.vue'
import PoolSystemManagement from '@/modules/pool/components/system/PoolSystemManagement.vue'
import PoolSystemNetworking from '@/modules/pool/components/system/PoolSystemNetworking.vue'
import PoolSystemStorageConfiguration from '@/modules/pool/components/system/PoolSystemStorageConfiguration.vue'
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
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
