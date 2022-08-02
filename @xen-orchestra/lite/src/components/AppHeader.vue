<template>
  <header class="app-header">
    <RouterLink :to="{ name: 'home' }">
      <img alt="XO Lite" src="../assets/logo.png" style="width: 8rem" />
    </RouterLink>
    <slot />
    <span style="cursor: pointer" @click="toggleTheme">Switch theme</span>
    <div class="right">
      <AccountButton />
    </div>
  </header>
</template>

<script lang="ts" setup>
import AccountButton from '@/components/AccountButton.vue';

const toggleTheme = () => {
  document.documentElement.classList.toggle('dark');
};
</script>

<style lang="postcss" scoped>
.app-header {
  display: flex;
  align-items: center;
  min-height: 8rem;
  padding: 0 0.8rem;
  border-bottom: 0.1rem solid var(--color-blue-scale-400);
  background-color: var(--background-color-secondary);
}

.right {
  margin-left: auto;
}
</style>
