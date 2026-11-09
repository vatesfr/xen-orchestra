<template>
  <component :is="slots.panel ? VtsContentSidePanel : 'div'">
    <div class="detail-page-layout" :class="{ mobile: uiStore.isSmall }">
      <slot name="alert" />
      <div class="body">
        <nav class="menu">
          <slot name="menu" :size="menuItemSize" />
        </nav>
        <div class="content">
          <slot />
        </div>
      </div>
    </div>
    <slot name="panel" />
  </component>
</template>

<script lang="ts" setup>
import type { MenuItemSize } from '@core/components/ui/menu-item/UiMenuItem.vue'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'

const slots = defineSlots<{
  default(): any
  alert?(): any
  menu(props: { size: MenuItemSize }): any
  panel?(): any
}>()

const uiStore = useUiStore()

const menuItemSize = computed<MenuItemSize>(() => (uiStore.isSmall ? 'small' : 'large'))
</script>

<style lang="postcss" scoped>
.detail-page-layout {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 0.8rem;

  .body {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .menu {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.8rem;
  }

  .content {
    flex: 1;
    min-width: 0;
  }

  &.mobile .body {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
