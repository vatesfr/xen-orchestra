<template>
  <div class="core-layout">
    <header class="header">
      <slot name="app-logo" />
      <UiButtonIcon
        v-tooltip="sidebarStore.isExpanded ? 'Close sidebar' : 'Open sidebar'"
        :icon="sidebarStore.isExpanded ? faAngleDoubleLeft : faBars"
        class="sidebar-toggle"
        @click="sidebarStore.toggleExpand()"
      />
      <slot name="app-header" />
    </header>
    <div class="container">
      <div
        v-if="sidebarStore.isExpanded && !sidebarStore.isPinned"
        class="sidebar-overlay"
        @click="sidebarStore.toggleExpand(false)"
      />
      <LayoutSidebar class="sidebar">
        <template #header>
          <slot name="sidebar-header" />
        </template>
        <template #default>
          <slot name="sidebar-content" />
        </template>
        <template #footer>
          <slot name="sidebar-footer" />
        </template>
      </LayoutSidebar>
      <div class="main-container">
        <header>
          <slot name="content-header" />
        </header>
        <main class="main">
          <div class="content">
            <slot name="content" />
          </div>
          <div v-if="isPanelVisible" :class="{ mobile: uiStore.isMobile }" class="panel">
            <header v-if="$slots['panel-header'] || uiStore.isMobile" class="panel-header">
              <UiButtonIcon
                v-if="uiStore.isMobile"
                :icon="faAngleLeft"
                class="panel-close-icon"
                @click="panelStore.close()"
              />
              <slot name="panel-header" />
            </header>
            <div v-if="$slots['panel-content']" class="panel-content">
              <slot name="panel-content" />
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/button/ButtonIcon.vue'
import LayoutSidebar from '@core/components/layout/LayoutSidebar.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { usePanelStore } from '@core/stores/panel.store'
import { useSidebarStore } from '@core/stores/sidebar.store'
import { useUiStore } from '@core/stores/ui.store'
import { faAngleDoubleLeft, faAngleLeft, faBars } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const sidebarStore = useSidebarStore()
const panelStore = usePanelStore()
const uiStore = useUiStore()

const slots = defineSlots<{
  'app-logo'(): any
  'app-header'(): any
  'sidebar-header'(): any
  'sidebar-content'(): any
  'sidebar-footer'(): any
  'content-header'(): any
  content(): any
  'panel-header'(): any
  'panel-content'(): any
}>()

const isPanelVisible = computed(() => {
  if (!slots['panel-header'] && !slots['panel-content']) {
    return false
  }

  return panelStore.isExpanded
})
</script>

<style lang="postcss" scoped>
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

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
  background-color: var(--background-color-secondary);
  border-bottom: 0.1rem solid var(--color-grey-500);
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
}

.main {
  background-color: var(--background-color-secondary);
  display: flex;
  flex: 1;
}

.content {
  padding: 0.8rem;
  flex: 1;
  border-right: 0.1rem solid var(--color-grey-500);
}

.panel {
  display: flex;
  flex-direction: column;
  width: 40rem;
  background-color: var(--background-color-secondary);

  &.mobile {
    width: 100%;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 0.4rem 1.6rem;
  background-color: var(--background-color-primary);
  border-bottom: 0.1rem solid var(--color-grey-500);
  min-height: 4.8rem;
}

.panel-close-icon {
  margin-right: auto;
}

.panel-content {
  flex: 1;
  padding: 0.8rem;
  overflow: auto;
  min-height: 0;
}
</style>
