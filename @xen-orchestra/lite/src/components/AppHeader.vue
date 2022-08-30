<template>
  <header class="app-header">
    <RouterLink :to="{ name: 'home' }">
      <img alt="XO Lite" src="../assets/logo.svg" />
    </RouterLink>
    <slot />
    <div class="right">
      <FontAwesomeIcon
        :icon="colorModeIcon"
        style="font-size: 1.5em"
        @click="toggleTheme"
      />
      <FormWidget :before="faEarthAmericas">
        <select v-model="$i18n.locale">
          <option v-for="locale in $i18n.availableLocales" :key="locale">
            {{ locale }}
          </option>
        </select>
      </FormWidget>
      <AccountButton />
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import {
  faEarthAmericas,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { useLocalStorage } from "@vueuse/core";
import FormWidget from "@/components/FormWidget.vue";
import AccountButton from "@/components/AccountButton.vue";

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

.right {
  display: flex;
  align-items: center;
}
</style>
