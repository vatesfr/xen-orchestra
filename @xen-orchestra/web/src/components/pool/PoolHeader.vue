<template>
  <UiHeadBar :icon="faCity">
    {{ pool.name_label }}
    <template #actions>
      <UiLink size="medium" :to="{ name: '/vm/new', query: { poolid: pool.id } }" :icon="faPlus">
        {{ t('new-vm') }}
      </UiLink>
    </template>
  </UiHeadBar>
  <TabList>
    <TabItem disabled>{{ t('dashboard') }}</TabItem>
    <TabItem disabled>{{ t('alarms') }}</TabItem>
    <TabItem disabled>{{ t('stats') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/system`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('system') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/networks`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('network') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ t('storage') }}</TabItem>
    <TabItem disabled>{{ t('tasks') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/hosts`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('hosts') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/vms`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('vms', 2) }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import type { XoPool } from '@/types/xo/pool.type'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { faCity, faPlus } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { t } = useI18n()
</script>
