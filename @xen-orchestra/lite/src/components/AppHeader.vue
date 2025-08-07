<template>
  <header class="app-header">
    <div class="left">
      <UiButtonIcon
        v-if="!uiStore.isDesktopLarge"
        ref="navigationTrigger"
        :class="{ 'menu-to-right': !uiStore.isMobile }"
        :icon="faBars"
        accent="brand"
        size="medium"
      />
      <RouterLink :to="logoRoute" class="logo-container">
        <img v-if="uiStore.isMobile" alt="XO Lite" src="../assets/logo.svg" />
        <TextLogo v-else />
      </RouterLink>
    </div>
    <slot />
    <div class="right">
      <PoolOverrideWarning as-tooltip />
      <XoaButton v-if="!uiStore.isMobile" />
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
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useUiStore } from '@core/stores/ui.store'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const uiStore = useUiStore()
const { pool } = usePoolStore().getContext()

const navigationStore = useNavigationStore()
const { trigger: navigationTrigger } = storeToRefs(navigationStore)

const logoRoute = computed<RouteLocationRaw>(() =>
  pool.value
    ? {
        name: '/pool/[uuid]/dashboard',
        params: { uuid: pool.value.uuid },
      }
    : { name: '/' }
)
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
