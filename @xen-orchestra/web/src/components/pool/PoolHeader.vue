<template>
  <UiHeadBar :icon="faCity">
    {{ pool.name_label }}
  </UiHeadBar>
  <TabList>
    <TabItem disabled>{{ $t('dashboard') }}</TabItem>
    <TabItem disabled>{{ $t('alarms') }}</TabItem>
    <TabItem disabled>{{ $t('stats') }}</TabItem>
    <TabItem disabled>{{ $t('system') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/networks`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('network') }}
      </TabItem>
    </RouterLink>
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
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  pool: XoPool
}>()
</script>
