<template>
  <div v-if="!xenApiStore.isConnected" style="display: flex">
    <AppLogin />
  </div>
  <div v-else>
    <AppHeader />
    <div style="display: flex">
      <nav class="nav">
        <InfraPoolList />
      </nav>
      <main class="main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watchEffect } from "vue";
import AppHeader from "@/components/AppHeader.vue";
import AppLogin from "@/components/AppLogin.vue";
import InfraPoolList from "@/components/infra/InfraPoolList.vue";
import { useXenApiStore } from "@/stores/xen-api.store";

const xenApiStore = useXenApiStore();

watchEffect(() => {
  if (xenApiStore.isConnected) {
    xenApiStore.init();
  }
});
</script>

<style lang="postcss">
@import "@/assets/base.css";

.nav {
  overflow: auto;
  width: 37rem;
  max-width: 37rem;
  height: calc(100vh - 9rem);
  padding: 0.5rem;
  background-color: var(--background-color-primary);
  border-right: 1px solid var(--color-blue-scale-400);
}

.main {
  flex: 1;
  background-color: var(--background-color-secondary);
  height: calc(100vh - 9rem);
  overflow: auto;
}
</style>
