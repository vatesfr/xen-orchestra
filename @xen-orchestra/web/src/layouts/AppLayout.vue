<template>
  <CoreLayout>
    <template #app-logo>
      <RouterLink class="logo-link" to="/">
        <LogoTextOnly :short="uiStore.isMobile" class="logo" />
      </RouterLink>
    </template>
    <template #app-header>
      <UiButton :right-icon="faArrowUpRightFromSquare" level="tertiary">XO 5</UiButton>
      <ButtonIcon
        v-tooltip="{ content: $t('tasks.quick-view'), placement: 'bottom-end' }"
        :icon="faBarsProgress"
        size="large"
      />
      <AccountMenu />
    </template>
    <template #sidebar-content>
      <InfraPoolList />
    </template>
    <template #content>
      <slot />
    </template>
  </CoreLayout>
</template>

<script lang="ts" setup>
import AccountMenu from '@/components/account-menu/AccountMenu.vue'
import InfraPoolList from '@/components/infra/InfraPoolList.vue'
import LogoTextOnly from '@/components/LogoTextOnly.vue'
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import UiButton from '@core/components/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { useUiStore } from '@core/stores/ui.store'
import { faArrowUpRightFromSquare, faBarsProgress } from '@fortawesome/free-solid-svg-icons'

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.logo-link {
  display: flex;
  align-self: stretch;
  align-items: center;
}

.logo {
  height: 1.6rem;
}
</style>
