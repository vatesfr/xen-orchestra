<template>
  <UiTabList :disabled="!isReady">
    <RouterTab :to="{ name: 'pool.dashboard', params: { uuid: pool?.uuid } }">
      {{ $t('dashboard') }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.alarms', params: { uuid: pool?.uuid } }" disabled>
      {{ $t('alarms') }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.stats', params: { uuid: pool?.uuid } }" disabled>
      {{ $t('stats') }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.system', params: { uuid: pool?.uuid } }" disabled>
      {{ $t('system') }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.network', params: { uuid: pool?.uuid } }" disabled>
      {{ $t('network') }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.storage', params: { uuid: pool?.uuid } }" disabled>
      {{ $t('storage') }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.tasks', params: { uuid: pool?.uuid } }">
      {{ $t('tasks') }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.hosts', params: { uuid: pool?.uuid } }" disabled>
      {{ $t('hosts') }}
    </RouterTab>
    <RouterTab :to="{ name: 'pool.vms', params: { uuid: pool?.uuid } }">
      {{ $t('vms') }}
    </RouterTab>
  </UiTabList>
</template>

<script lang="ts" setup>
import RouterTab from '@/components/RouterTab.vue'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import UiTabList from '@core/components/ui/tab-list/UiTabList.vue'

const { pool, isReady } = usePoolStore().subscribe()
</script>
