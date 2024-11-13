<template>
  <div class="core-layout">
    <header class="header">
      <slot name="app-logo" />
      <UiButtonIcon
        v-tooltip="{
          content: sidebarStore.isExpanded ? $t('core.sidebar.close') : $t('core.sidebar.open'),
          placement: 'right',
        }"
        accent="info"
        size="medium"
        :icon="sidebarStore.isExpanded ? faAngleDoubleLeft : faBars"
        class="sidebar-toggle"
        @click="sidebarStore.toggleExpand()"
      />
      <slot name="app-header" />
    </header>
    <div class="container">
      <VtsBackdrop v-if="sidebarStore.isExpanded && !sidebarStore.isLocked" @click="sidebarStore.toggleExpand(false)" />
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
      <main class="main-container">
        <slot name="content" />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import VtsLayoutSidebar from '@core/components/layout/VtsLayoutSidebar.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useSidebarStore } from '@core/stores/sidebar.store'
import { faAngleDoubleLeft, faBars } from '@fortawesome/free-solid-svg-icons'

const sidebarStore = useSidebarStore()
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
