<template>
  <UiTabList>
    <RouterTab :to="{ name: 'host.dashboard', params: { uuid } }" disabled>
      {{ $t('dashboard') }}
    </RouterTab>
    <RouterTab :to="{ name: 'host.console', params: { uuid } }">
      {{ $t('console') }}
    </RouterTab>
    <RouterTab :to="{ name: 'host.network', params: { uuid } }" disabled>
      {{ $t('network') }}
    </RouterTab>
    <RouterTab :to="{ name: 'host.tasks', params: { uuid } }" disabled>
      {{ $t('tasks') }}
    </RouterTab>
    <RouterTab :to="{ name: 'host.vms', params: { uuid } }" disabled>
      {{ $t('vms') }}
    </RouterTab>
  </UiTabList>
</template>

<script lang="ts" setup>
import RouterTab from '@/components/RouterTab.vue'
import UiTabList from '@core/components/ui/tab-list/UiTabList.vue'

defineProps<{
  uuid: string
}>()
</script>
