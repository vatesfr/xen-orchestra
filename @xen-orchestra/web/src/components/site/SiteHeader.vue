<template>
  <UiHeadBar :icon="faCity" />
  <TabList>
    <RouterLink v-slot="{ isActive, href }" to="/dashboard" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('dashboard') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ $t('alarms') }}</TabItem>
    <TabItem disabled>{{ $t('stats') }}</TabItem>
    <TabItem disabled>{{ $t('system') }}</TabItem>
    <TabItem disabled>{{ $t('network') }}</TabItem>
    <TabItem disabled>{{ $t('storage') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" to="/tasks" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('tasks') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ $t('hosts') }}</TabItem>
    <TabItem disabled>{{ $t('vms') }}</TabItem>
  </TabList>
</template>

<script lang="ts" setup>
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'
</script>
