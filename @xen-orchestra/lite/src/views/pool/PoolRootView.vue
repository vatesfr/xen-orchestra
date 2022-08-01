<template>
  <div class="pool-root-view">
    <PoolHeader />
    <PoolTabBar />
    <div class="view">
      <RouterView />
    </div>
  </div>
</template>

<script lang="ts" setup>
import PoolHeader from "@/components/pool/PoolHeader.vue";
import PoolTabBar from "@/components/pool/PoolTabBar.vue";
</script>

<style lang="postcss" scoped>
.view {
  padding: 2rem;
}
</style>
