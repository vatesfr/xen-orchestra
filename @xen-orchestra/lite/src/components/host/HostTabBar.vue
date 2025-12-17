<template>
  <TabList>
    <RouterTab :to="{ name: '/host/[uuid]/dashboard', params: { uuid } }">
      {{ t('dashboard') }}
    </RouterTab>
    <RouterTab :to="{ name: '/host/[uuid]/console', params: { uuid } }">
      {{ t('console') }}
    </RouterTab>
    <RouterTab :to="{ name: '/host/[uuid]/system', params: { uuid } }">
      {{ t('system') }}
    </RouterTab>
    <RouterTab :to="{ name: '/host/[uuid]/network', params: { uuid } }">
      {{ t('network') }}
    </RouterTab>
    <RouterTab :to="{ name: '/host/[uuid]/tasks', params: { uuid } }" disabled>
      {{ t('tasks') }}
    </RouterTab>
    <RouterTab :to="{ name: '/host/[uuid]/vms', params: { uuid } }">
      {{ t('vms') }}
    </RouterTab>
  </TabList>
</template>

<script lang="ts" setup>
import RouterTab from '@/components/RouterTab.vue'
import TabList from '@core/components/tab/TabList.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  uuid: string
}>()

const { t } = useI18n()
</script>
