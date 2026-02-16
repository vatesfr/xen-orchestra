<template>
  <div class="core-layout">
    <header v-if="uiStore.hasUi" class="header">
      <slot name="app-logo" />
      <UiButtonIcon
        v-tooltip="{
          content: sidebarStore.isExpanded ? t('action:sidebar-close') : t('action:sidebar-open'),
          placement: 'right',
        }"
        accent="brand"
        size="medium"
        icon="fa:bars"
        class="sidebar-toggle"
        :target-scale="1.8"
        @click="sidebarStore.toggleExpand()"
      />
      <slot name="app-header" />
    </header>
    <VtsBanner v-if="showBanner" accent="danger">
      <UiInfo accent="danger">
        {{ t('unable-to-connect-to-xo-server') }}
      </UiInfo>
      <template #addons>
        <UiButton variant="primary" accent="brand" size="small" @click="handleRetry()">
          {{ t('retry') }}
        </UiButton>
      </template>
    </VtsBanner>
    <div class="container">
      <template v-if="uiStore.hasUi">
        <VtsBackdrop
          v-if="sidebarStore.isExpanded && !sidebarStore.isLocked"
          @click="sidebarStore.toggleExpand(false)"
        />
        <VtsLayoutSidebar class="sidebar">
          <template #header>
            <slot name="sidebar-header" />
          </template>
          <template #default>
            <slot name="sidebar-content" />
          </template>
          <template #footer>
            <slot name="sidebar-footer" />
          </template>
        </VtsLayoutSidebar>
      </template>
      <main class="main-container">
        <slot name="content" />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import VtsLayoutSidebar from '@core/components/layout/VtsLayoutSidebar.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useSseStore } from '@core/packages/remote-resource/sse.store.ts'
import { useSidebarStore } from '@core/stores/sidebar.store'
import { useUiStore } from '@core/stores/ui.store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const uiStore = useUiStore()
const sidebarStore = useSidebarStore()

const sseStore = useSseStore()

const { hasErrorSse } = storeToRefs(sseStore)

const showBanner = computed(() => hasErrorSse.value)

function handleRetry() {
  sseStore.retry()
}
</script>

<style lang="postcss" scoped>
.core-layout {
  display: flex;
  height: 100dvh;
  flex-direction: column;
}

.container {
  display: flex;
  flex: 1;
  min-height: 0;
}

.header {
  display: flex;
  align-items: center;
  height: 5.6rem;
  background-color: var(--color-neutral-background-secondary);
  border-bottom: 0.1rem solid var(--color-neutral-border);
  flex-shrink: 0;
  gap: 1.6rem;
  padding: 0 1.6rem;
}

.sidebar-toggle {
  margin-right: auto;
}

.main-container {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-background-secondary);
}
</style>
