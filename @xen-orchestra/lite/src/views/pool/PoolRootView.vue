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
import { usePoolCollection } from '@/stores/xen-api/pool.store'
import { usePageTitleStore } from '@/stores/page-title.store'

const { pool } = usePoolCollection()

usePageTitleStore().setObject(pool)
</script>

<style lang="postcss" scoped></style>
