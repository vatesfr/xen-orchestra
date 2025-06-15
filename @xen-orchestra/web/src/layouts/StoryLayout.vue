<template>
  <CoreLayout>
    <template #app-logo>
      <RouterLink class="logo-link" to="/">
        <LogoTextOnly :short="uiStore.isMobile" class="logo" />
      </RouterLink>
    </template>
    <template #sidebar-header>
      <SidebarSearch v-model="filter" />
    </template>
    <template #sidebar-content>
      <StoryTree :nodes root />
    </template>
    <template #content>
      <slot />
    </template>
  </CoreLayout>
</template>

<script lang="ts" setup>
import LogoTextOnly from '@/components/LogoTextOnly.vue'
import SidebarSearch from '@/components/SidebarSearch.vue'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { buildRouteHierarchy } from '@core/packages/story/build-route-hierarchy.ts'
import StoryTree from '@core/packages/story/StoryTree.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { ref } from 'vue'

const uiStore = useUiStore()

const filter = ref('')

const nodes = buildRouteHierarchy()
</script>

<style lang="postcss" scoped>
.logo-link {
  display: flex;
  align-self: stretch;
  align-items: center;
}

.logo {
  height: 1.6rem;
}
</style>
