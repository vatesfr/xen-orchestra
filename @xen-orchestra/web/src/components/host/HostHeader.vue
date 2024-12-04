<template>
  <UiHeadBar>
    <template #icon>
      <UiObjectIcon size="medium" type="host" :state="host.power_state.toLocaleLowerCase() as HostState" />
    </template>
    {{ host.name_label }}
  </UiHeadBar>
  <UiTabList>
    <UiTab disabled>{{ $t('dashboard') }}</UiTab>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/console`" custom>
      <UiTab :selected="isActive" :href tag="a">
        {{ $t('console') }}
      </UiTab>
    </RouterLink>
    <UiTab disabled>{{ $t('alarms') }}</UiTab>
    <UiTab disabled>{{ $t('stats') }}</UiTab>
    <UiTab disabled>{{ $t('system') }}</UiTab>
    <UiTab disabled>{{ $t('network') }}</UiTab>
    <UiTab disabled>{{ $t('storage') }}</UiTab>
    <UiTab disabled>{{ $t('tasks') }}</UiTab>
    <RouterLink v-slot="{ isActive, href }" :to="`/host/${host.id}/vms`" custom>
      <UiTab :selected="isActive" :href tag="a">
        {{ $t('vms') }}
      </UiTab>
    </RouterLink>
  </UiTabList>
</template>

<script lang="ts" setup>
import type { XoHost } from '@/types/xo/host.type'
import type { HostState } from '@core/types/object-icon.type'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiTab from '@core/components/ui/tab/UiTab.vue'
import UiTabList from '@core/components/ui/tab-list/UiTabList.vue'

defineProps<{
  host: XoHost
}>()
</script>
