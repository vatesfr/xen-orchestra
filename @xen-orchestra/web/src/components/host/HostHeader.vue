<template>
  <VtsHeadBar>
    <template #icon>
      <ObjectIcon type="host" :state="host.power_state.toLocaleLowerCase() as HostState" />
    </template>
    {{ host.name_label }}
  </VtsHeadBar>
  <TabList>
    <TabItem disabled>{{ $t('dashboard') }}</TabItem>
    <TabItem disabled>{{ $t('console') }}</TabItem>
    <TabItem disabled>{{ $t('alarms') }}</TabItem>
    <TabItem disabled>{{ $t('stats') }}</TabItem>
    <TabItem disabled>{{ $t('system') }}</TabItem>
    <TabItem disabled>{{ $t('network') }}</TabItem>
    <TabItem disabled>{{ $t('storage') }}</TabItem>
    <TabItem disabled>{{ $t('tasks') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/vms`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('vms') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import type { XoHost } from '@/types/xo/host.type'
import type { HostState } from '@core/types/object-icon.type'
import VtsHeadBar from '@core/components/head-bar/VtsHeadBar.vue'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'

defineProps<{
  host: XoHost
}>()
</script>
