<template>
  <VtsHeadBar :icon="faCity">
    {{ pool.name_label }}
  </VtsHeadBar>
  <TabList>
    <TabItem disabled>{{ $t('dashboard') }}</TabItem>
    <TabItem disabled>{{ $t('alarms') }}</TabItem>
    <TabItem disabled>{{ $t('stats') }}</TabItem>
    <TabItem disabled>{{ $t('system') }}</TabItem>
    <TabItem disabled>{{ $t('network') }}</TabItem>
    <TabItem disabled>{{ $t('storage') }}</TabItem>
    <TabItem disabled>{{ $t('tasks') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/hosts`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('hosts') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/vms`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('vms') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import type { XoPool } from '@/types/xo/pool.type'
import VtsHeadBar from '@core/components/head-bar/VtsHeadBar.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  pool: XoPool
}>()
</script>
