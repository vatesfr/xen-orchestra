<template>
  <UiHeadBar :icon="faCity">
    {{ pool.name_label }}
  </UiHeadBar>
  <VtsTabList>
    <VtsTabItem disabled>{{ $t('dashboard') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('alarms') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('stats') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('system') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('network') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('storage') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('tasks') }}</VtsTabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/hosts`" custom>
      <VtsTabItem :selected="isActive" :href tag="a">
        {{ $t('hosts') }}
      </VtsTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/vms`" custom>
      <VtsTabItem :selected="isActive" :href tag="a">
        {{ $t('vms') }}
      </VtsTabItem>
    </RouterLink>
  </VtsTabList>
</template>

<script lang="ts" setup>
import type { XoPool } from '@/types/xo/pool.type'
import VtsTabItem from '@core/components/tab/VtsTabItem.vue'
import VtsTabList from '@core/components/tab/VtsTabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  pool: XoPool
}>()
</script>
