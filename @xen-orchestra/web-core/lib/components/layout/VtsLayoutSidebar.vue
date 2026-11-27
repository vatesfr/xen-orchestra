<template>
  <div :class="className" class="vts-layout-sidebar">
    <VtsResizeHandle v-if="showResizeHandle" :position="resizeHandlePosition" :resizable="sidebar" />
    <div v-if="slots.header || (showLock && !ui.isSmall)" class="header">
      <div v-if="slots.header" class="start">
        <slot name="header" />
      </div>
      <div v-if="showLock && !ui.isSmall" class="lock">
        <UiButtonIcon
          v-tooltip="{
            content: sidebar.isLocked ? t('action:sidebar-unlock') : t('action:sidebar-lock'),
            placement: lockTooltipPosition,
          }"
          :aria-label="sidebar.isLocked ? t('action:sidebar-unlock') : t('action:sidebar-lock')"
          accent="brand"
          size="small"
          :icon="sidebar.isLocked ? 'fa:thumb-tack-slash' : 'fa:thumb-tack'"
          @click="sidebar.toggleLock()"
        />
      </div>
    </div>
    <div v-if="slots.subheader" class="subheader">
      <slot name="subheader" />
    </div>
    <div class="content">
      <slot />
    </div>
    <div v-if="slots.footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsResizeHandle from '@core/components/resize-handle/VtsResizeHandle.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { type SidebarSide, useLeftSidebarStore, useRightSidebarStore } from '@core/packages/sidebar'
import { useUiStore } from '@core/stores/ui.store.ts'
import { IK_MENU_ACTION_HANDLER } from '@core/utils/injection-keys.util.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, provide } from 'vue'
import { useI18n } from 'vue-i18n'

const { side = 'left', showLock = true } = defineProps<{
  side?: SidebarSide
  showLock?: boolean
}>()

const slots = defineSlots<{
  default(): any
  header?(): any
  subheader?(): any
  footer?(): any
}>()

const { t } = useI18n()

const ui = useUiStore()

const leftSidebar = useLeftSidebarStore()
const rightSidebar = useRightSidebarStore()
const sidebar = computed(() => (side === 'right' ? rightSidebar : leftSidebar))

const lockTooltipPosition = computed(() => (side === 'left' ? 'right' : 'left'))

const showResizeHandle = computed(() => !ui.isSmall && sidebar.value.isExpanded)

const resizeHandlePosition = computed(() => (side === 'left' ? 'end' : 'start'))

provide(IK_MENU_ACTION_HANDLER, () => {
  if (ui.isSmall) {
    sidebar.value.toggleExpand(false)
  }
})

const className = computed(() => [
  {
    locked: sidebar.value.isLocked && !ui.isSmall,
    bordered: !ui.isSmall,
  },
  ...toVariants({ side }),
])
</script>

<style lang="postcss" scoped>
.vts-layout-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
  background-color: var(--color-neutral-background-secondary);
  width: v-bind('sidebar.cssWidth');
  z-index: 1010;
  transition:
    margin-inline 0.25s,
    transform 0.25s;

  &.bordered {
    &.side--left {
      border-inline-end: 0.1rem solid var(--color-neutral-border);
    }

    &.side--right {
      border-inline-start: 0.1rem solid var(--color-neutral-border);
    }
  }

  &.locked {
    &.side--left {
      margin-inline-start: v-bind('sidebar.cssLockedOffset');
    }

    &.side--right {
      margin-inline-end: v-bind('sidebar.cssLockedOffset');
    }
  }

  &:not(.locked) {
    position: absolute;

    &.side--left {
      inset-inline-start: 0;
    }

    &.side--right {
      inset-inline-end: 0;
    }

    transform: translateX(v-bind('sidebar.cssUnlockedOffset'));
  }

  .header,
  .subheader,
  .content {
    &:not(:last-child) {
      border-block-end: 0.1rem solid var(--color-neutral-border);
    }
  }

  .header {
    display: flex;
    align-items: center;
    background-color: var(--color-neutral-background-primary);

    .start {
      flex: 1;
      overflow-x: auto;
    }

    .lock {
      flex-shrink: 0;
      margin-inline-start: auto;
      margin-inline-end: 0.8rem;
      margin-block: 0.4rem;
      z-index: 2;
    }
  }

  .content {
    flex: 1;
    overflow: auto;
  }
}
</style>
