<template>
  <div class="pool-root-view">
    <PoolHeader />
    <PoolTabBar />

    <RouterView class="tab-view" />
  </div>
</template>

<script lang="ts" setup>
import PoolHeader from "@/components/pool/PoolHeader.vue";
import PoolTabBar from "@/components/pool/PoolTabBar.vue";
</script>

<style lang="postcss" scoped>
.tab-view {
  min-height: calc(100vh - 23.5vh);
}
</style>
