<template>
  <template v-if="drawerStore.drawers.length > 0">
    <DrawerProvider v-for="(drawer, index) of drawerStore.drawers" :key="drawer.id" :drawer>
      <component
        :is="drawer.component"
        v-bind="drawer.props"
        :current="index === drawerStore.drawers.length - 1"
        @confirm="drawer.onConfirm"
        @cancel="drawer.onCancel"
      />
    </DrawerProvider>
  </template>
</template>

<script lang="ts" setup>
import { useDrawerStore } from '@core/packages/drawer/drawer.store.ts'
import DrawerProvider from '@core/packages/drawer/DrawerProvider.vue'

const drawerStore = useDrawerStore()
</script>
