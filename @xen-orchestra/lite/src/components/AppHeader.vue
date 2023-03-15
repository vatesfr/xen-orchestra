<template>
  <header class="app-header">
    <UiIcon
      v-if="isMobile"
      ref="navigationTrigger"
      :icon="faBars"
      class="toggle-navigation"
    />
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
import AccountButton from "@/components/AccountButton.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { useNavigationStore } from "@/stores/navigation.store";
import { useUiStore } from "@/stores/ui.store";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { storeToRefs } from "pinia";

const uiStore = useUiStore();
const { isMobile } = storeToRefs(uiStore);

const navigationStore = useNavigationStore();
const { trigger: navigationTrigger } = storeToRefs(navigationStore);
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
