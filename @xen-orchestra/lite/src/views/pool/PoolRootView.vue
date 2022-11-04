<template>
  <div class="pool-root-view">
    <PoolHeader />
    <PoolTabBar />
    <div class="card-view">
      <RouterView />
    </div>
  </div>
</template>

<script lang="ts" setup>
import PoolHeader from "@/components/pool/PoolHeader.vue";
import PoolTabBar from "@/components/pool/PoolTabBar.vue";
</script>

<style lang="postcss" scoped></style>
