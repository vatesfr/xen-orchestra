<template>
  <VtsLayoutSidebar :side class="app-navigation-sidebar">
    <template #header>
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
    </template>
    <template v-if="activeSidebarPanel === SIDEBAR_PANEL.TREEVIEW" #subheader>
      <SidebarSearch v-model="filter" />
    </template>
    <template v-if="activeSidebarPanel === SIDEBAR_PANEL.TREEVIEW">
      <VtsStateHero v-if="!isConnected && !isDevPage" format="card" type="busy" size="medium" class="loader" />
      <VtsTreeList v-else-if="!isReady">
        <VtsTreeLoadingItem v-for="i in 5" :key="i" icon="object:pool" />
      </VtsTreeList>
      <VtsStateHero v-else-if="isSearching" format="card" type="busy" size="medium" class="loader" />
      <VtsStateHero v-else-if="treeItems.length === 0" format="card" size="medium" type="no-result">
        {{ t('no-result') }}
      </VtsStateHero>
      <SiteTreeList v-else ref="siteTreeList" :items="treeItems" />
    </template>
    <AdministrationMenu v-else />
  </VtsLayoutSidebar>
</template>

<script lang="ts" setup>
import AdministrationMenu from '@/modules/navigation/components/AdministrationMenu.vue'
import { useXoSiteTree } from '@/modules/site/composables/xo-site-tree.composable.ts'
import SidebarSearch from '@/modules/treeview/components/SidebarSearch.vue'
import SiteTreeList from '@/modules/treeview/components/SiteTreeList.vue'
import type { SidebarSide } from '@core/packages/sidebar'
import VtsLayoutSidebar from '@core/components/layout/VtsLayoutSidebar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import { useSseStore } from '@core/packages/remote-resource/sse.store.ts'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { side = 'left' } = defineProps<{
  side?: SidebarSide
}>()

const { t } = useI18n()

const sseStore = useSseStore()

const { isConnected } = storeToRefs(sseStore)

const SIDEBAR_PANEL = {
  TREEVIEW: 'treeview',
  ADMINISTRATION: 'administration',
} as const

type SidebarPanel = (typeof SIDEBAR_PANEL)[keyof typeof SIDEBAR_PANEL]

const activeSidebarPanel = ref<SidebarPanel>(SIDEBAR_PANEL.TREEVIEW)

const { treeItems, treeItemIndexById, isReady, filter, isSearching, expandToNode } = useXoSiteTree()

const route = useRoute<'/pool/[id]' | '/host/[id]' | '/vm/[id]'>()

const siteTreeList = useTemplateRef('siteTreeList')

const isDevPage = computed(() => route.path.startsWith('/dev'))

let scrolledToId: string | undefined

async function scrollToActiveNode() {
  const paramId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id

  if (!paramId) {
    scrolledToId = undefined
    return
  }

  if (paramId === scrolledToId) {
    return
  }

  const node = expandToNode(paramId)
  if (!node) {
    return
  }

  const index = treeItemIndexById.value.get(node.id)
  if (index === undefined) {
    return
  }

  scrolledToId = paramId

  await nextTick()

  siteTreeList.value?.scrollToItem(index)
}

watch(
  [() => route.params.id, isReady, treeItems],
  () => {
    if (isReady.value) {
      scrollToActiveNode()
    }
  },
  { immediate: true }
)
</script>

<style lang="postcss" scoped>
.app-navigation-sidebar {
  .loader {
    padding-top: 4rem;
  }

  .sidebar-tabs {
    border-block-end: 0;
    box-sizing: border-box;
    height: 4rem;
  }

  .sidebar-tab {
    appearance: none;
    border-block-start: 0;
    border-inline: 0;
    padding: 0.4rem 0.8rem;
  }
}
</style>
