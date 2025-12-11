<template>
  <CoreLayout>
    <template #app-logo>
      <RouterLink class="logo-link" :class="{ mobile: uiStore.isMobile }" to="/">
        <UiLogoText :text="t('xen-orchestra')" />
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
import AccountMenu from '@/components/account-menu/AccountMenu.vue'
import SidebarSearch from '@/components/SidebarSearch.vue'
import QuickTaskButton from '@/components/task/QuickTaskButton.vue'
import ThirdParties from '@/components/third-parties/ThirdParties.vue'
import SiteTreeList from '@/components/tree/SiteTreeList.vue'
import { useSiteTree } from '@/composables/site-tree.composable'
import { useXoRoutes } from '@/remote-resources/use-xo-routes.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogoText from '@core/components/ui/logo-text/UiLogoText.vue'
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
  text-decoration: none;
  height: 5.76rem;
}

.loader {
  padding-top: 4rem;
}

.mobile {
  display: none;
}
</style>
