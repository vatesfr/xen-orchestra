<template>
  <header class="app-header">
    <RouterLink :to="{ name: 'home' }">
      <img alt="XO Lite" src="../assets/logo.svg" />
    </RouterLink>
    <slot />
    <div style="display: flex; align-items: center; gap: 1rem">
      <FontAwesomeIcon
        :icon="colorModeIcon"
        style="font-size: 1.5em"
        @click="toggleTheme"
      />
      <span @click="logout">Logout</span>
      <FormWidget :before="faEarthAmericas">
        <select v-model="$i18n.locale">
          <option v-for="locale in $i18n.availableLocales" :key="locale">
            {{ locale }}
          </option>
        </select>
      </FormWidget>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import {
  faEarthAmericas,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { useLocalStorage } from "@vueuse/core";
import FormWidget from "@/components/FormWidget.vue";
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
