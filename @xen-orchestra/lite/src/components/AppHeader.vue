<template>
  <header class="app-header">
    <RouterLink :to="{ name: 'home' }">
      <img alt="XO Lite" src="../assets/logo.svg" />
    </RouterLink>
    <slot />
    <div class="right">
      <AccountButton />
    </div>
  </header>
</template>

<script lang="ts" setup>
import AccountButton from '@/components/AccountButton.vue'
</script>

<style lang="postcss" scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 8rem;
  padding: 1rem;
  border-bottom: 0.1rem solid var(--color-blue-scale-400);
  background-color: var(--background-color-secondary);

  img {
    width: 4rem;
  }
}

.right {
  display: flex;
  align-items: center;
}
</style>
