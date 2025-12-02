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
        @click="openUrl(xo5Route, true)"
      >
        XO 5
      </UiButton>
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
import ThirdParties from '@/components/third-parties/ThirdParties.vue'
import SiteTreeList from '@/components/tree/SiteTreeList.vue'
import { useSiteTree } from '@/composables/pool-tree.composable'
import { useXoRoutes } from '@/remote-resources/use-xo-routes.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { useUiStore } from '@core/stores/ui.store'
import { openUrl } from '@core/utils/open-url.utils'
import { onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

defineSlots<{
  default(): any
}>()
const { t } = useI18n()
const { routes } = useXoRoutes()
const xo5Route = computed(() => routes.value?.xo5 ?? '')

const uiStore = useUiStore()
const { sites, isReady, filter, isSearching, scrollToNodeElement } = useSiteTree()
const route = useRoute<'/pool/[id]' | '/host/[id]' | '/vm/[id]'>()

async function scrollToRouteParamId() {
  const paramId = route.params.id

  if (!isReady.value) return

  await Promise.resolve() // Wait for DOM update
  await scrollToNodeElement(paramId)
}

onMounted(() => {
  scrollToRouteParamId()
})

watch(
  () => route.params.id,
  async () => {
    await scrollToRouteParamId()
  }
)
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
