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

const { pool } = usePoolStore().subscribe()

usePageTitleStore().setObject(pool)
</script>
