<template>
  <header class="app-header">
    <UiIcon
      v-if="isMobile"
      ref="navigationTrigger"
      :icon="faBars"
      class="toggle-navigation"
    />
    <RouterLink :to="{ name: 'home' }">
      <img v-if="isMobile" alt="XO Lite" src="../assets/logo.svg" />
      <TextLogo v-else />
    </RouterLink>
    <slot />
    <div class="right">
      <WarningNotTheCurrentPool display-tooltip />
      <AccountButton />
    </div>
  </header>
</template>

<script lang="ts" setup>
import AccountButton from "@/components/AccountButton.vue";
import TextLogo from "@/components/TextLogo.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { useNavigationStore } from "@/stores/navigation.store";
import { useUiStore } from "@/stores/ui.store";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { storeToRefs } from "pinia";
import WarningNotTheCurrentPool from "@/components/WarningNotTheCurrentPool.vue";

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
  height: 5.5rem;
  padding: 1rem;
  border-bottom: 0.1rem solid var(--color-blue-scale-400);
  background-color: var(--background-color-secondary);

  img {
    width: 4rem;
  }

  .text-logo {
    margin-left: 1rem;
    vertical-align: middle;
  }

  .warning-not-current-pool {
    font-size: 2.4rem;
  }
}

.right {
  display: flex;
  align-items: center;
}
</style>
