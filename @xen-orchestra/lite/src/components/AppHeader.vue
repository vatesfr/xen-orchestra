<template>
  <header class="app-header">
    <div class="left">
      <UiButtonIcon
        v-if="!uiStore.isDesktopL"
        ref="navigationTrigger"
        :icon="faBars"
        accent="brand"
        size="medium"
        :class="{ 'menu-to-right': !uiStore.isMobile }"
      />
      <RouterLink :to="{ name: 'home' }" class="logo-container">
        <img v-if="uiStore.isMobile" alt="XO Lite" src="../assets/logo.svg" />
        <TextLogo v-else />
      </RouterLink>
    </div>
    <slot />
    <div class="right">
      <PoolOverrideWarning as-tooltip />
      <XoaButton v-if="uiStore.isDesktop" />
      <AccountMenu />
    </div>
  </header>
</template>

<script lang="ts" setup>
import AccountMenu from '@/components/account-menu/AccountMenu.vue'
import PoolOverrideWarning from '@/components/PoolOverrideWarning.vue'
import TextLogo from '@/components/TextLogo.vue'
import XoaButton from '@/components/XoaButton.vue'
import { useNavigationStore } from '@/stores/navigation.store'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useUiStore } from '@core/stores/ui.store'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { storeToRefs } from 'pinia'

const uiStore = useUiStore()

const navigationStore = useNavigationStore()
const { trigger: navigationTrigger } = storeToRefs(navigationStore)
</script>

<style lang="postcss" scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 5.6rem;
  padding: 0 1.6rem;
  border-bottom: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-secondary);

  img {
    width: 3.7rem;
  }

  .text-logo {
    margin-left: 1rem;
    vertical-align: middle;
  }

  .warning-not-current-pool {
    font-size: 2.4rem;
  }
}

.left {
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 1023px) {
    flex: 1;
  }
}

.menu-to-right {
  order: 1;
}

.logo-container {
  @media (max-width: 1023px) {
    flex: 1;
    text-align: center;
  }
}

.right {
  display: flex;
  align-items: center;
  gap: 2rem;
}
</style>
