<template>
  <div class="pool-root-view">
    <PoolHeader />
    <PoolTabBar />

    <RouterView />
  </div>
</template>

<script lang="ts" setup>
import PoolHeader from '@/components/pool/PoolHeader.vue'
import PoolTabBar from '@/components/pool/PoolTabBar.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/pool/[uuid]', 'dashboard')

const { pool } = usePoolStore().subscribe()

usePageTitleStore().setObject(pool)
</script>
