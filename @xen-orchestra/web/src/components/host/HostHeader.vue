<template>
  <HeadBar>
    <template #icon>
      <ObjectIcon type="host" :state="host.power_state.toLocaleLowerCase() as HostState" />
    </template>
    {{ host.name_label }}
  </HeadBar>
  <VtsTabList>
    <VtsTabItem disabled>{{ $t('dashboard') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('console') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('alarms') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('stats') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('system') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('network') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('storage') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('tasks') }}</VtsTabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/vms`" custom>
      <VtsTabItem :selected="isActive" :href tag="a">
        {{ $t('vms') }}
      </VtsTabItem>
    </RouterLink>
  </VtsTabList>
</template>

<script lang="ts" setup>
import type { XoHost } from '@/types/xo/host.type'
import type { HostState } from '@core/types/object-icon.type'
import HeadBar from '@core/components/head-bar/HeadBar.vue'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import VtsTabItem from '@core/components/tab/VtsTabItem.vue'
import VtsTabList from '@core/components/tab/VtsTabList.vue'

defineProps<{
  host: XoHost
}>()
</script>
