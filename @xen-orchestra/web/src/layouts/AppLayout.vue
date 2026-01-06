<template>
  <CoreLayout>
    <template #app-logo>
      <RouterLink class="logo-link" to="/">
        <LogoTextOnly :key="String(uiStore.isMobile)" :short="uiStore.isMobile" class="logo" />
      </RouterLink>
    </template>
    <template #app-header>
      <UiLink size="medium" :href="xo5Route">{{ t('xo-5') }}</UiLink>
      <ThirdParties />
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
      <VtsStateHero v-else-if="isSearching" format="card" size="medium" type="busy" class="loader" />
      <VtsStateHero v-else-if="sites.length === 0" format="card" size="medium" type="no-result">
        {{ t('no-result') }}
      </VtsStateHero>
      <SiteTreeList v-else :branches="sites" />
    </template>
    <template #content>
      <slot />
    </template>
  </CoreLayout>
</template>

<script lang="ts" setup>
import LogoTextOnly from '@/components/LogoTextOnly.vue'
import AccountMenu from '@/modules/account/components/menu/AccountMenu.vue'
import { useSiteTree } from '@/modules/site/composables/site-tree.composable'
import QuickTaskButton from '@/modules/task/components/QuickTaskButton.vue'
import ThirdParties from '@/modules/third-parties/components/ThirdParties.vue'
import SidebarSearch from '@/modules/treeview/components/SidebarSearch.vue'
import SiteTreeList from '@/modules/treeview/components/SiteTreeList.vue'
import { useXoRoutes } from '@/remote-resources/use-xo-routes.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { useUiStore } from '@core/stores/ui.store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineSlots<{
  default(): any
}>()
const { t } = useI18n()

const uiStore = useUiStore()

const { sites, isReady, filter, isSearching } = useSiteTree()
const { buildXo5Route } = useXoRoutes()
const xo5Route = computed(() => buildXo5Route('/'))
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
