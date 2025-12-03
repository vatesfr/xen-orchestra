<template>
  <UiHeadBar icon="fa:city">
    {{ pool.name_label }}
    <template #actions>
      <UiLink size="medium" :to="{ name: '/vm/new', query: { poolid: pool.id } }" icon="fa:plus">
        {{ t('new-vm') }}
      </UiLink>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/dashboard`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('dashboard') }}
      </TabItem>
    </RouterLink>
    <TabItem>
      <UiLink :href="xo5PoolStatsHref" size="medium">
        {{ t('stats') }}
      </UiLink>
    </TabItem>
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
    <RouterLink v-slot="{ isActive, href }" :to="`/pool/${pool.id}/storage`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('storage') }}
      </TabItem>
    </RouterLink>
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
import { useXoRoutes } from '@/remote-resources/use-xo-routes.ts'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoPool } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5PoolStatsHref = computed(() => buildXo5Route(`/pools/${pool.id}/stats`))
</script>
