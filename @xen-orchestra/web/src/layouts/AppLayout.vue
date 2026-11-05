<template>
  <CoreLayout class="app-layout">
    <template #header-start>
      <RouterLink :class="{ mobile: uiStore.isSmall }" :to="{ name: '/(site)/dashboard' }" class="logo-link">
        <UiLogoText :text="t('xen-orchestra')" />
      </RouterLink>
      <UiButtonIcon
        v-tooltip="{
          content: leftSidebar.isExpanded ? t('action:sidebar-close') : t('action:sidebar-open'),
          placement: 'right',
        }"
        :target-scale="1.8"
        accent="brand"
        icon="fa:bars"
        size="medium"
        @click="leftSidebar.toggleExpand()"
      />
    </template>
    <template #header-end>
      <UiLink :href="xo5Route" size="medium">{{ t('xo-5') }}</UiLink>
      <ThirdParties />
      <QuickTaskButton />
      <AccountMenu />
    </template>
    <template #left-sidebar>
      <AppNavigationSidebar />
    </template>
    <template #content>
      <VtsStateHero v-if="showLoader" format="page" size="large" type="busy">
        <div class="state-content">
          <span class="typo-caption">{{ t('loading') }}</span>
          <span class="title typo-h1">{{ t('please-wait') }}</span>
          <div class="description typo-body-bold">
            <I18nT keypath="page-please-wait" scope="global">
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
import AppNavigationSidebar from '@/modules/navigation/components/AppNavigationSidebar.vue'
import QuickTaskButton from '@/modules/task/components/QuickTaskButton.vue'
import ThirdParties from '@/modules/third-parties/components/ThirdParties.vue'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogoText from '@core/components/ui/logo-text/UiLogoText.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { useSseStore } from '@core/packages/remote-resource/sse.store.ts'
import { useLeftSidebarStore } from '@core/packages/sidebar'
import { useUiStore } from '@core/stores/ui.store.ts'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const uiStore = useUiStore()
const leftSidebar = useLeftSidebarStore()
const sseStore = useSseStore()

const { isConnected } = storeToRefs(sseStore)

const route = useRoute()

const { buildXo5Route } = useXoRoutes()
const xo5Route = computed(() => buildXo5Route('/'))

const isDevPage = computed(() => route.path.startsWith('/dev'))

// With `ui=0` (console opened in a new tab), neither the header nor the sidebar is mounted,
// so nothing opens the SSE connection before the page content does.
// The page content handles its own loading state, so don't block it on the SSE connection.
const showLoader = computed(() => {
  if (isDevPage.value) {
    return false
  }

  if (!uiStore.hasUi) {
    return false
  }

  return !isConnected.value
})
</script>

<style lang="postcss" scoped>
.app-layout {
  .logo-link {
    display: flex;
    align-self: stretch;
    align-items: center;
    text-decoration: none;
    height: 5.76rem;
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
}
</style>
