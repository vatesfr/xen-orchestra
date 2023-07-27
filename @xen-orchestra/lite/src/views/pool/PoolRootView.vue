<template>
  <div class="pool-root-view">
    <PoolHeader />
    <PoolTabBar />

    <RouterView />
  </div>
</template>

<script lang="ts" setup>
import PoolHeader from "@/components/pool/PoolHeader.vue";
import PoolTabBar from "@/components/pool/PoolTabBar.vue";
import { usePoolStore } from "@/stores/pool.store";
import { usePageTitleStore } from "@/stores/page-title.store";

const { pool } = usePoolStore().subscribe();
usePageTitleStore().setObject(pool);
</script>

<style lang="postcss" scoped></style>
