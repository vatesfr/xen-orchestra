<template>
  <div
    :class="{
      locked: sidebar.isLocked && !ui.isSmall,
      expanded: sidebar.isExpanded,
      mobile: ui.isSmall,
      'border-right': !ui.isSmall,
    }"
    class="vts-layout-sidebar"
  >
    <div v-if="!ui.isSmall" class="lock">
      <UiButtonIcon
        v-tooltip="{
          content: sidebar.isLocked ? t('action:sidebar-unlock') : t('action:sidebar-lock'),
          placement: 'right',
        }"
        accent="brand"
        size="small"
        :icon="sidebar.isLocked ? 'fa:thumb-tack-slash' : 'fa:thumb-tack'"
        @click="sidebar.toggleLock()"
      />
    </div>
    <div v-if="slots.header">
      <slot name="header" />
    </div>
    <div class="content">
      <slot />
    </div>
    <div v-if="slots.footer">
      <slot name="footer" />
    </div>
    <div
      v-if="!ui.isSmall"
      :class="{ active: sidebar.isResizing }"
      class="resize-handle"
      @mousedown="sidebar.startResize"
    />
  </div>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useSidebarStore } from '@core/stores/sidebar.store'
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'

const slots = defineSlots<{
  default(): any
  header?(): any
  footer?(): any
}>()

const { t } = useI18n()

const sidebar = useSidebarStore()
const ui = useUiStore()
</script>

<style lang="postcss" scoped>
.vts-layout-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-neutral-background-secondary);
  width: v-bind('sidebar.cssWidth');
  z-index: 1010;
  transition:
    margin-left 0.25s,
    transform 0.25s;

  &.border-right {
    border-right: 0.1rem solid var(--color-neutral-border);
  }

  &.locked {
    margin-left: v-bind('sidebar.cssOffset');
  }

  &:not(.locked) {
    position: absolute;
    transform: translateX(v-bind('sidebar.cssOffset'));
  }

  .lock {
    text-align: right;
    padding: 0.8rem 0.8rem 0;
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
}
</style>
