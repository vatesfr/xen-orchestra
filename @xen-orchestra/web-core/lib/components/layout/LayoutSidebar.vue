<!-- v1.0 -->
<template>
  <div
    :class="{ locked: sidebar.isLocked && !ui.isMobile, expanded: sidebar.isExpanded, mobile: ui.isMobile }"
    class="layout-sidebar"
  >
    <div v-if="!ui.isMobile" class="lock">
      <UiButtonIcon
        v-tooltip="{
          content: sidebar.isLocked ? $t('core.sidebar.unlock') : $t('core.sidebar.lock'),
          placement: 'right',
        }"
        :icon="sidebar.isLocked ? faLock : faLockOpen"
        @click="sidebar.toggleLock()"
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
  background-color: var(--color-neutral-background-secondary);
  border-right: 0.1rem solid var(--color-neutral-border);
  width: v-bind('sidebar.cssWidth');
  z-index: 1001;
  transition:
    margin-left 0.25s,
    transform 0.25s;

  &.locked {
    margin-left: v-bind('sidebar.cssOffset');
  }

  &:not(.locked) {
    position: absolute;
    transform: translateX(v-bind('sidebar.cssOffset'));
  }
}

.lock {
  text-align: right;
  padding: 0.8rem;
}

.content {
  flex: 1;
  overflow: auto;
}

.resize-handle {
  position: absolute;
  inset: 0 0 0 auto;
  width: 0.8rem;
  background-color: transparent;
  cursor: col-resize;
  transition: background-color 0.4s;
  user-select: none;

  &:hover,
  &.active {
    background-color: var(--color-neutral-border);
    transition: background-color 0.05s;
  }
}
</style>
