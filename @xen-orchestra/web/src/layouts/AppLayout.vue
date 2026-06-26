<template>
  <CoreLayout>
    <template #app-logo>
      <RouterLink class="logo-link" :class="{ mobile: uiStore.isSmall }" :to="{ name: '/(site)/dashboard' }">
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
      <TabList class="sidebar-tabs">
        <TabItem
          :active="activeSidebarPanel === SIDEBAR_PANEL.TREEVIEW"
          tag="button"
          type="button"
          class="sidebar-tab"
          @click="activeSidebarPanel = SIDEBAR_PANEL.TREEVIEW"
        >
          {{ t('treeview') }}
        </TabItem>
        <TabItem
          :active="activeSidebarPanel === SIDEBAR_PANEL.ADMINISTRATION"
          tag="button"
          type="button"
          class="sidebar-tab"
          @click="activeSidebarPanel = SIDEBAR_PANEL.ADMINISTRATION"
        >
          {{ t('administration') }}
        </TabItem>
      </TabList>
      <SidebarSearch v-if="activeSidebarPanel === SIDEBAR_PANEL.TREEVIEW" v-model="filter" />
    </template>
    <template #sidebar-content>
      <template v-if="activeSidebarPanel === SIDEBAR_PANEL.TREEVIEW">
        <VtsStateHero v-if="!isConnected && !isDevPage" format="card" type="busy" size="medium" class="loader" />
        <VtsTreeList v-else-if="!isReady">
          <VtsTreeLoadingItem v-for="i in 5" :key="i" icon="object:pool" />
        </VtsTreeList>
        <VtsStateHero v-else-if="isSearching" format="card" type="busy" size="medium" class="loader" />
        <VtsStateHero v-else-if="sites.length === 0" format="card" size="medium" type="no-result">
          {{ t('no-result') }}
        </VtsStateHero>
        <SiteTreeList v-else :branches="sites" />
      </template>
      <AdministrationMenu v-else />
    </template>
    <template #content>
      <VtsStateHero v-if="!isConnected && !isDevPage" format="page" type="busy" size="large">
        <div class="state-content">
          <span class="typo-caption">{{ t('loading') }}</span>
          <span class="title typo-h1">{{ t('please-wait') }}</span>
          <div class="description typo-body-bold">
            <I18nT scope="global" keypath="page-please-wait">
              <template #newline><br /></template>
            </I18nT>
          </div>
        </div>
      </VtsStateHero>
      <slot v-else />
    </template>
  </CoreLayout>
</template>

<script lang="ts" setup>
import AccountMenu from '@/modules/account/components/menu/AccountMenu.vue'
import AdministrationMenu from '@/modules/navigation/components/AdministrationMenu.vue'
import { useXoSiteTree } from '@/modules/site/composables/xo-site-tree.composable.ts'
import QuickTaskButton from '@/modules/task/components/QuickTaskButton.vue'
import ThirdParties from '@/modules/third-parties/components/ThirdParties.vue'
import SidebarSearch from '@/modules/treeview/components/SidebarSearch.vue'
import SiteTreeList from '@/modules/treeview/components/SiteTreeList.vue'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogoText from '@core/components/ui/logo-text/UiLogoText.vue'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { useSseStore } from '@core/packages/remote-resource/sse.store.ts'
import { useUiStore } from '@core/stores/ui.store'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

defineSlots<{
  default(): any
}>()

const router = useRouter()
const { t } = useI18n()

const uiStore = useUiStore()

const sseStore = useSseStore()

const { isConnected } = storeToRefs(sseStore)

const SIDEBAR_PANEL = {
  TREEVIEW: 'treeview',
  ADMINISTRATION: 'administration',
} as const

type SidebarPanel = (typeof SIDEBAR_PANEL)[keyof typeof SIDEBAR_PANEL]

const activeSidebarPanel = ref<SidebarPanel>(SIDEBAR_PANEL.TREEVIEW)

const { sites, isReady, filter, isSearching, scrollToNodeElement } = useXoSiteTree()
const route = useRoute<'/pool/[id]' | '/host/[id]' | '/vm/[id]'>()

router.isReady().then(() => {
  activeSidebarPanel.value = route.path.startsWith('/administration')
    ? SIDEBAR_PANEL.ADMINISTRATION
    : SIDEBAR_PANEL.TREEVIEW
})

const { buildXo5Route } = useXoRoutes()
const xo5Route = computed(() => buildXo5Route('/'))

const isDevPage = computed(() => route.path.startsWith('/dev'))

async function scrollToRouteParamId() {
  const paramId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
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
  text-decoration: none;
  height: 5.76rem;
}

.loader {
  padding-top: 4rem;
}

.sidebar-tabs {
  border-block-end: 0;
  box-sizing: border-box;
  height: 4rem;
  padding-inline-end: 4.8rem;
}

.sidebar-tab {
  appearance: none;
  border-block-start: 0;
  border-inline: 0;
  padding: 0.4rem 0.8rem;
}

.mobile {
  display: none;
}
.state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.4rem;
  text-align: center;

  .title {
    color: var(--color-neutral-txt-primary);
  }

  .description {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
