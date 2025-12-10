<template>
  <TabList :disabled="!isReady">
    <RouterTab :to="{ name: '/pool/[uuid]/dashboard', params: { uuid: pool?.uuid ?? '-' } }">
      {{ t('dashboard') }}
    </RouterTab>
    <RouterTab :to="{ name: '/pool/[uuid]/alarms', params: { uuid: pool?.uuid ?? '-' } }" disabled>
      {{ t('alarms') }}
    </RouterTab>
    <RouterTab :to="{ name: '/pool/[uuid]/stats', params: { uuid: pool?.uuid ?? '-' } }" disabled>
      {{ t('stats') }}
    </RouterTab>
    <RouterTab :to="{ name: '/pool/[uuid]/system', params: { uuid: pool?.uuid ?? '-' } }">
      {{ t('system') }}
    </RouterTab>
    <RouterTab :to="{ name: '/pool/[uuid]/network', params: { uuid: pool?.uuid ?? '-' } }">
      {{ t('network') }}
    </RouterTab>
    <RouterTab :to="{ name: '/pool/[uuid]/storage', params: { uuid: pool?.uuid ?? '-' } }" disabled>
      {{ t('storage') }}
    </RouterTab>
    <RouterTab :to="{ name: '/pool/[uuid]/tasks', params: { uuid: pool?.uuid ?? '-' } }">
      {{ t('tasks') }}
    </RouterTab>
    <RouterTab :to="{ name: '/pool/[uuid]/hosts', params: { uuid: pool?.uuid ?? '-' } }">
      {{ t('hosts') }}
    </RouterTab>
    <RouterTab :to="{ name: '/pool/[uuid]/vms', params: { uuid: pool?.uuid ?? '-' } }">
      {{ t('vms', 2) }}
    </RouterTab>
  </TabList>
</template>

<script lang="ts" setup>
import RouterTab from '@/components/RouterTab.vue'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import TabList from '@core/components/tab/TabList.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { pool, isReady } = usePoolStore().subscribe()
</script>
