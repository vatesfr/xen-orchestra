<template>
  <UiHeadBar icon="object:pool">
    {{ pool.name_label }}
    <template #actions>
      <UiLink size="medium" :to="{ name: '/vm/new', query: { poolid: pool.id } }" icon="fa:plus">
        {{ t('new-vm') }}
      </UiLink>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('dashboard') }}
      </TabItem>
    </RouterLink>
    <TabItem>
      <UiLink :href="xo5PoolStatsHref" size="medium">
        {{ t('stats') }}
      </UiLink>
    </TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/system', params: { id: pool.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('system') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/networks', params: { id: pool.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('network') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/storage', params: { id: pool.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('storage') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/tasks', params: { id: pool.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('tasks') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/hosts', params: { id: pool.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('hosts') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/vms', params: { id: pool.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('vms') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5PoolStatsHref = computed(() => buildXo5Route(`/pools/${pool.id}/stats`))
</script>
