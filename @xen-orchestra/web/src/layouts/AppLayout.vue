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
        :right-icon="faArrowUpRightFromSquare"
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
        <VtsTreeLoadingItem v-for="i in 5" :key="i" :icon="faCity" />
      </VtsTreeList>
      <NoResults v-else-if="sites.length === 0" />
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
import NoResults from '@/components/NoResults.vue'
import SidebarSearch from '@/components/SidebarSearch.vue'
import QuickTaskButton from '@/components/task/QuickTaskButton.vue'
import SiteTreeList from '@/components/tree/SiteTreeList.vue'
import { useSiteTree } from '@/composables/pool-tree.composable'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { useUiStore } from '@core/stores/ui.store'
import { openUrl } from '@core/utils/open-url.utils'
import { faArrowUpRightFromSquare, faCity } from '@fortawesome/free-solid-svg-icons'

defineSlots<{
  default(): any
}>()

const uiStore = useUiStore()

const { sites, isReady, filter } = useSiteTree()
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
