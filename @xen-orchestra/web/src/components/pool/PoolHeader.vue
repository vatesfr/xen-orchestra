<template>
  <UiHeadBar :icon="faCity">
    {{ pool.name_label }}
  </UiHeadBar>
  <UiTabList>
    <UiTab disabled>{{ $t('dashboard') }}</UiTab>
    <UiTab disabled>{{ $t('alarms') }}</UiTab>
    <UiTab disabled>{{ $t('stats') }}</UiTab>
    <UiTab disabled>{{ $t('system') }}</UiTab>
    <UiTab disabled>{{ $t('network') }}</UiTab>
    <UiTab disabled>{{ $t('storage') }}</UiTab>
    <UiTab disabled>{{ $t('tasks') }}</UiTab>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/hosts`" custom>
      <UiTab :selected="isActive" :href tag="a">
        {{ $t('hosts') }}
      </UiTab>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/vms`" custom>
      <UiTab :selected="isActive" :href tag="a">
        {{ $t('vms') }}
      </UiTab>
    </RouterLink>
  </UiTabList>
</template>

<script lang="ts" setup>
import type { XoPool } from '@/types/xo/pool.type'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTab from '@core/components/ui/tab/UiTab.vue'
import UiTabList from '@core/components/ui/tab-list/UiTabList.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  pool: XoPool
}>()
</script>
