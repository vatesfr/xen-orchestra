<template>
  <div
    :class="{ pinned: sidebar.isPinned && !ui.isMobile, expanded: sidebar.isExpanded, mobile: ui.isMobile }"
    class="layout-sidebar"
  >
    <div v-if="!ui.isMobile" class="pin">
      <UiButtonIcon
        v-tooltip="{ content: sidebar.isPinned ? 'Unpin sidebar' : 'Pin sidebar', placement: 'right' }"
        :icon="sidebar.isPinned ? faLock : faLockOpen"
        @click="sidebar.togglePin()"
      />
    </div>
    <div v-if="$slots.header">
      <slot name="header" />
    </div>
    <div class="content">
      <slot />
    </div>
    <div v-if="$slots.footer">
      <slot name="footer" />
    </div>
    <div
      v-if="!ui.isMobile"
      :class="{ active: sidebar.isResizing }"
      class="resize-handle"
      @mousedown="sidebar.startResize"
    />
  </div>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/button/ButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useSidebarStore } from '@core/stores/sidebar.store'
import { useUiStore } from '@core/stores/ui.store'
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons'

defineSlots<{
  header(): any
  default(): any
  footer(): any
}>()

const sidebar = useSidebarStore()
const ui = useUiStore()
</script>

<style lang="postcss" scoped>
.layout-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--background-color-secondary);
  border-right: 0.1rem solid var(--color-grey-500);
  width: v-bind('sidebar.cssWidth');
  z-index: 1001;
  transition:
    margin-left 0.25s,
    transform 0.25s;

  &.pinned {
    margin-left: v-bind('sidebar.cssOffset');
  }

  &:not(.pinned) {
    position: absolute;
    transform: translateX(v-bind('sidebar.cssOffset'));
  }
}

.pin {
  text-align: right;
  padding: 0.8rem;
}

.content {
  flex: 1;
  overflow: auto;
}

.resize-handle {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 0.8rem;
  background-color: transparent;
  cursor: col-resize;
  transition: background-color 0.4s;
  user-select: none;

  &:hover,
  &.active {
    background-color: var(--color-grey-500);
    transition: background-color 0.05s;
  }
}
</style>
