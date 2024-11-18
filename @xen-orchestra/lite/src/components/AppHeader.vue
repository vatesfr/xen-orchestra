<template>
  <header class="app-header">
    <UiIcon v-if="isMobile" ref="navigationTrigger" :icon="faBars" class="toggle-navigation" />
    <RouterLink :to="{ name: 'home' }">
      <img v-if="isMobile" alt="XO Lite" src="../assets/logo.svg" />
      <TextLogo v-else />
    </RouterLink>
    <slot />
    <div class="right">
      <PoolOverrideWarning as-tooltip />
      <XoaButton v-if="isDesktop" />
      <AccountMenu />
    </div>
  </header>
</template>

<script lang="ts" setup>
import AccountMenu from '@/components/account-menu/AccountMenu.vue'
import PoolOverrideWarning from '@/components/PoolOverrideWarning.vue'
import TextLogo from '@/components/TextLogo.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import XoaButton from '@/components/XoaButton.vue'
import { useNavigationStore } from '@/stores/navigation.store'
import { useUiStore } from '@core/stores/ui.store'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { storeToRefs } from 'pinia'

const uiStore = useUiStore()
const { isMobile, isDesktop } = storeToRefs(uiStore)

const navigationStore = useNavigationStore()
const { trigger: navigationTrigger } = storeToRefs(navigationStore)
</script>

<style lang="postcss" scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 5.6rem;
  padding: 1rem;
  border-bottom: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-secondary);

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
  gap: 2rem;
}
</style>
