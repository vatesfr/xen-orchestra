<template>
  <TabList :disabled="!isReady">
    <RouterTab :to="{ name: 'pool.system', params: { uuid: pool?.uuid } }">DEFERRED HOST + VM</RouterTab>
    <RouterTab :to="{ name: 'pool.network', params: { uuid: pool?.uuid } }">VM ONLY</RouterTab>
    <RouterTab :to="{ name: 'pool.storage', params: { uuid: pool?.uuid } }">HOST + VM</RouterTab>
    <RouterTab :to="{ name: 'pool.hosts', params: { uuid: pool?.uuid } }">NONE</RouterTab>
  </TabList>
</template>

<script lang="ts" setup>
import RouterTab from '@/components/RouterTab.vue'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import TabList from '@core/components/tab/TabList.vue'

const { pool, isReady } = usePoolStore().subscribe()
</script>
