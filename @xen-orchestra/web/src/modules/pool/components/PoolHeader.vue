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
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('dashboard') }}
      </UiTabItem>
    </RouterLink>
    <UiTabItem>
      <UiLink :href="xo5PoolStatsHref" size="medium">
        {{ t('stats') }}
      </UiLink>
    </UiTabItem>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/system', params: { id: pool.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('system') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/networks', params: { id: pool.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('network') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/traffic-rules', params: { id: pool.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('traffic-rules') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/storage', params: { id: pool.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('storage') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/tasks', params: { id: pool.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('tasks') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/hosts', params: { id: pool.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('hosts') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/pool/[id]/vms', params: { id: pool.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('vms') }}
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import TabList from '@core/components/tab-list/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5PoolStatsHref = computed(() => buildXo5Route(`/pools/${pool.id}/stats`))
</script>
