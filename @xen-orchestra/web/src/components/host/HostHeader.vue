<template>
  <UiHeadBar>
    <template #icon>
      <UiObjectIcon size="medium" type="host" :state="host.power_state.toLocaleLowerCase() as HostState" />
    </template>
    {{ host.name_label }}
  </UiHeadBar>
  <TabList>
    <TabItem disabled>{{ $t('dashboard') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/console`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('console') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ $t('alarms') }}</TabItem>
    <TabItem disabled>{{ $t('stats') }}</TabItem>
    <TabItem disabled>{{ $t('system') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/network`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('network') }}
      </TabItem>
    </RouterLink>
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
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'

defineProps<{
  host: XoHost
}>()
</script>
