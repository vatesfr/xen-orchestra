<template>
  <div class="core-layout">
    <header v-if="uiStore.hasUi" class="header">
      <div v-if="slots['header-start']" class="header-start">
        <slot name="header-start" />
      </div>
      <div v-if="slots['header-end']" class="header-end">
        <slot name="header-end" />
      </div>
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
      <VtsBackdrop v-if="uiStore.hasUi && showBackdrop" @click="handleBackdropClick()" />
      <slot v-if="uiStore.hasUi && hasLeftSidebar" name="left-sidebar" />
      <main class="main-container">
        <slot name="content" />
      </main>
      <slot v-if="uiStore.hasUi && hasRightSidebar" name="right-sidebar" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useSseStore } from '@core/packages/remote-resource/sse.store.ts'
import { useLeftSidebarStore, useRightSidebarStore } from '@core/packages/sidebar'
import { useUiStore } from '@core/stores/ui.store.ts'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const slots = defineSlots<{
  'header-start'?(): any
  'header-end'?(): any
  'left-sidebar'?(): any
  'right-sidebar'?(): any
  content(): any
}>()

const { t } = useI18n()

const uiStore = useUiStore()
const leftSidebar = useLeftSidebarStore()
const rightSidebar = useRightSidebarStore()

const hasLeftSidebar = computed(() => !!slots['left-sidebar'])
const hasRightSidebar = computed(() => !!slots['right-sidebar'])

const isLeftOverlaying = computed(() => hasLeftSidebar.value && leftSidebar.isExpanded && !leftSidebar.isLocked)
const isRightOverlaying = computed(() => hasRightSidebar.value && rightSidebar.isExpanded && !rightSidebar.isLocked)

const showBackdrop = computed(() => isLeftOverlaying.value || isRightOverlaying.value)

const sseStore = useSseStore()

const { hasErrorSse } = storeToRefs(sseStore)

const showBanner = computed(() => hasErrorSse.value)

function handleRetry() {
  sseStore.retry()
}

function handleBackdropClick() {
  if (isLeftOverlaying.value) {
    leftSidebar.toggleExpand(false)
  }

  if (isRightOverlaying.value) {
    rightSidebar.toggleExpand(false)
  }
}
</script>

<style lang="postcss" scoped>
.core-layout {
  display: flex;
  height: 100dvh;
  flex-direction: column;

  .container {
    position: relative;
    display: flex;
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    height: 5.6rem;
    background-color: var(--color-neutral-background-secondary);
    border-block-end: 0.1rem solid var(--color-neutral-border);
    flex-shrink: 0;
    gap: 1.6rem;
    padding-block: 0;
    padding-inline: 1.6rem;
  }

  .header-start,
  .header-end {
    display: flex;
    align-items: center;
    gap: 1.6rem;
  }

  .header-end {
    margin-inline-start: auto;
  }

  .main-container {
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
    background-color: var(--color-neutral-background-secondary);
  }
}
</style>
