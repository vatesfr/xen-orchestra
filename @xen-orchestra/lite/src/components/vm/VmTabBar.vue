<template>
  <TabList>
    <RouterTab :to="{ name: '/vm/[uuid]/dashboard', params: { uuid } }">
      {{ t('dashboard') }}
    </RouterTab>
    <RouterTab :to="{ name: '/vm/[uuid]/console', params: { uuid } }">
      {{ t('console') }}
    </RouterTab>
    <RouterTab :to="{ name: '/vm/[uuid]/alarms', params: { uuid } }" disabled>
      {{ t('alarms') }}
    </RouterTab>
    <RouterTab :to="{ name: '/vm/[uuid]/stats', params: { uuid } }" disabled>
      {{ t('stats') }}
    </RouterTab>
    <RouterTab :to="{ name: '/vm/[uuid]/system', params: { uuid } }">
      {{ t('system') }}
    </RouterTab>
    <RouterTab :to="{ name: '/vm/[uuid]/network', params: { uuid } }">
      {{ t('network') }}
    </RouterTab>
    <RouterTab :to="{ name: '/vm/[uuid]/storage', params: { uuid } }" disabled>
      {{ t('storage') }}
    </RouterTab>
    <RouterTab :to="{ name: '/vm/[uuid]/tasks', params: { uuid } }" disabled>
      {{ t('tasks') }}
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
