<template>
  <CoreLayout class="app-layout">
    <template #header-start>
      <RouterLink class="logo-link" :class="{ mobile: uiStore.isSmall }" :to="{ name: '/(site)/dashboard' }">
        <UiLogoText :text="t('xen-orchestra')" />
      </RouterLink>
      <UiButtonIcon
        v-tooltip="{
          content: leftSidebar.isExpanded ? t('action:sidebar-close') : t('action:sidebar-open'),
          placement: 'right',
        }"
        accent="brand"
        size="medium"
        icon="fa:bars"
        :target-scale="1.8"
        @click="leftSidebar.toggleExpand()"
      />
    </template>
    <template #header-end>
      <UiLink size="medium" :href="xo5Route">{{ t('xo-5') }}</UiLink>
      <ThirdParties />
      <MyTasksButton />
      <AccountMenu />
    </template>
    <template #left-sidebar>
      <AppNavigationSidebar />
    </template>
    <template #right-sidebar>
      <MyTasksSidebar />
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
import AppNavigationSidebar from '@/modules/navigation/components/AppNavigationSidebar.vue'
import MyTasksButton from '@/modules/task/components/MyTasksButton.vue'
import MyTasksSidebar from '@/modules/task/components/MyTasksSidebar.vue'
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
