<template>
  <div v-if="drawerStore.drawers.length > 0" class="vts-drawer-list">
    <DrawerProvider v-for="(drawer, index) of drawerStore.drawers" :key="drawer.id" :drawer>
      <component
        :is="drawer.component"
        class="drawer-component"
        v-bind="drawer.props"
        :current="index === drawerStore.drawers.length - 1"
        @confirm="drawer.onConfirm"
        @cancel="drawer.onCancel"
      />
    </DrawerProvider>
  </div>
</template>

<script lang="ts" setup>
import { useDrawerStore } from '@core/packages/drawer/drawer.store.ts'
import DrawerProvider from '@core/packages/drawer/DrawerProvider.vue'

const drawerStore = useDrawerStore()
</script>

<style lang="postcss" scoped>
.vts-drawer-list {
  position: fixed;
  inset: 0;
  background-color: var(--color-opacity-primary);
  z-index: 1020;

  .drawer-component:not(:last-child) {
    filter: brightness(0.8);
  }
}
</style>
