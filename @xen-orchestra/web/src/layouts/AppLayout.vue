<template>
  <CoreLayout>
    <template #app-logo>
      <RouterLink class="logo-link" to="/">
        <LogoTextOnly :key="String(uiStore.isMobile)" :short="uiStore.isMobile" class="logo" />
      </RouterLink>
    </template>
    <template #app-header>
      <UiButton
        size="medium"
        accent="brand"
        right-icon="fa:arrow-up-right-from-square"
        variant="tertiary"
        @click="openUrl('/', true)"
      >
        XO 5
      </UiButton>
      <QuickTaskButton />
      <AccountMenu />
    </template>
    <template #sidebar-header>
      <SidebarSearch v-model="filter" />
    </template>
    <template #sidebar-content>
      <VtsTreeList v-if="!isReady">
        <VtsTreeLoadingItem v-for="i in 5" :key="i" icon="fa:city" />
      </VtsTreeList>
      <VtsStateHero v-else-if="isSearching" format="card" busy size="medium" class="loader" />
      <VtsStateHero v-else-if="sites.length === 0" format="card" size="medium" type="no-result">
        {{ t('no-results') }}
      </VtsStateHero>
      <SiteTreeList v-else :branches="sites" />
    </template>
    <template #content>
      <slot />
    </template>
  </CoreLayout>
</template>

<script lang="ts" setup>
import AccountMenu from '@/components/account-menu/AccountMenu.vue'
import LogoTextOnly from '@/components/LogoTextOnly.vue'
import SidebarSearch from '@/components/SidebarSearch.vue'
import QuickTaskButton from '@/components/task/QuickTaskButton.vue'
import SiteTreeList from '@/components/tree/SiteTreeList.vue'
import { useSiteTree } from '@/composables/pool-tree.composable'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { useUiStore } from '@core/stores/ui.store'
import { openUrl } from '@core/utils/open-url.utils'
import { useI18n } from 'vue-i18n'

defineSlots<{
  default(): any
}>()
const { t } = useI18n()

const uiStore = useUiStore()

const { sites, isReady, filter, isSearching } = useSiteTree()
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

.loader {
  padding-top: 4rem;
}
</style>
