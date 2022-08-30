<template>
  <header class="app-header">
    <RouterLink :to="{ name: 'home' }">
      <img alt="XO Lite" src="../assets/logo.svg" />
    </RouterLink>
    <slot />
    <div>
      <span @click="toggleTheme"
        ><FontAwesomeIcon style="font-size: 1.5em" :icon="colorModeIcon"
      /></span>
      <span style="margin-left: 1rem" @click="logout">Logout</span>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { faMoon, faSun } from "@fortawesome/pro-solid-svg-icons";
import { useLocalStorage } from "@vueuse/core";
import { useXenApiStore } from "@/stores/xen-api.store";

const router = useRouter();

const colorMode = useLocalStorage<string>("colorMode", "dark");
const toggleTheme = () => {
  colorMode.value = document.documentElement.classList.toggle("dark")
    ? "dark"
    : "light";
};
const colorModeIcon = computed(() =>
  colorMode.value === "light" ? faMoon : faSun
);

const logout = () => {
  const xenApiStore = useXenApiStore();
  xenApiStore.disconnect();
  nextTick(() => router.push({ name: "home" }));
};
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
  span {
    cursor: pointer;
  }
}
</style>
