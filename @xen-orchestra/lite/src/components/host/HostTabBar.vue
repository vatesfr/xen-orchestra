<template>
  <TabList>
    <RouterTab :to="{ name: 'host.dashboard', params: { uuid } }">
      {{ $t('dashboard') }}
    </RouterTab>
    <RouterTab :to="{ name: 'host.console', params: { uuid } }">
      {{ $t('console') }}
    </RouterTab>
    <RouterTab :to="{ name: 'host.system', params: { uuid } }">
      {{ $t('system') }}
    </RouterTab>
    <RouterTab :to="{ name: 'host.network', params: { uuid } }">
      {{ $t('network') }}
    </RouterTab>
    <RouterTab :to="{ name: 'host.tasks', params: { uuid } }" disabled>
      {{ $t('tasks') }}
    </RouterTab>
    <RouterTab :to="{ name: 'host.vms', params: { uuid } }" disabled>
      {{ $t('vms') }}
    </RouterTab>
  </TabList>
</template>

<script lang="ts" setup>
import RouterTab from '@/components/RouterTab.vue'
import TabList from '@core/components/tab/TabList.vue'

defineProps<{
  uuid: string
}>()
</script>
