<template>
  <UiTabList>
    <RouterTab :to="{ name: 'vm.dashboard', params: { uuid } }" disabled>
      {{ $t('dashboard') }}
    </RouterTab>
    <RouterTab :to="{ name: 'vm.console', params: { uuid } }">
      {{ $t('console') }}
    </RouterTab>
    <RouterTab :to="{ name: 'vm.alarms', params: { uuid } }" disabled>
      {{ $t('alarms') }}
    </RouterTab>
    <RouterTab :to="{ name: 'vm.stats', params: { uuid } }" disabled>
      {{ $t('stats') }}
    </RouterTab>
    <RouterTab :to="{ name: 'vm.system', params: { uuid } }" disabled>
      {{ $t('system') }}
    </RouterTab>
    <RouterTab :to="{ name: 'vm.network', params: { uuid } }" disabled>
      {{ $t('network') }}
    </RouterTab>
    <RouterTab :to="{ name: 'vm.storage', params: { uuid } }" disabled>
      {{ $t('storage') }}
    </RouterTab>
    <RouterTab :to="{ name: 'vm.tasks', params: { uuid } }" disabled>
      {{ $t('tasks') }}
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
