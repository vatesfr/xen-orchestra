<template>
  <div
    class="vts-content-side-panel"
    :class="{ mobile: uiStore.isSmall, locked: panelStore.isLocked && !uiStore.isSmall }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { usePanelStore } from '@core/stores/panel.store'
import { useUiStore } from '@core/stores/ui.store'

const panelStore = usePanelStore()
const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.vts-content-side-panel {
  &.locked:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }
}
</style>
