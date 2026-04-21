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
      <SidebarSearch v-model="filter" />
    </template>
    <template #sidebar-content>
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
import { useXoSiteTree } from '@/modules/site/composables/xo-site-tree.composable.ts'
import QuickTaskButton from '@/modules/task/components/QuickTaskButton.vue'
import ThirdParties from '@/modules/third-parties/components/ThirdParties.vue'
import SidebarSearch from '@/modules/treeview/components/SidebarSearch.vue'
import SiteTreeList from '@/modules/treeview/components/SiteTreeList.vue'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogoText from '@core/components/ui/logo-text/UiLogoText.vue'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { useSseStore } from '@core/packages/remote-resource/sse.store.ts'
import { useUiStore } from '@core/stores/ui.store'
import { storeToRefs } from 'pinia'
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

defineSlots<{
  default(): any
}>()
const { t } = useI18n()

const uiStore = useUiStore()

const sseStore = useSseStore()

const { isConnected } = storeToRefs(sseStore)

const { sites, isReady, filter, isSearching, scrollToNodeElement } = useXoSiteTree()
const route = useRoute<'/pool/[id]' | '/host/[id]' | '/vm/[id]'>()

const { buildXo5Route } = useXoRoutes()
const xo5Route = computed(() => buildXo5Route('/'))

const isDevPage = computed(() => route.path.startsWith('/dev'))

async function scrollToRouteParamId() {
  const paramId = route.params.id
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
