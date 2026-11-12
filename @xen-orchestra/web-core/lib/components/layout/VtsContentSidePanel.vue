<template>
  <div
    class="vts-content-side-panel"
    :class="{
      mobile: uiStore.isSmall,
      'has-panel-column': hasPanelColumn,
      toggling: isToggling,
    }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { PANEL_TRANSITION_DURATION, usePanelStore } from '@core/stores/panel.store.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { refAutoReset } from '@vueuse/core'
import { computed, watch } from 'vue'

const panelStore = usePanelStore()
const uiStore = useUiStore()

const hasPanelColumn = computed(() => (panelStore.isLocked || panelStore.isExpanded) && !uiStore.isSmall)

const isToggling = refAutoReset(false, PANEL_TRANSITION_DURATION)

watch(hasPanelColumn, () => {
  isToggling.value = true
})

const columnTransition = `grid-template-columns ${PANEL_TRANSITION_DURATION}ms`
</script>

<style scoped lang="postcss">
.vts-content-side-panel {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 0;
    align-items: start;
    overflow-x: clip;
    min-height: min-content;

    &.has-panel-column {
      grid-template-columns: minmax(0, 1fr) v-bind('panelStore.cssWidth');
    }

    &.toggling {
      transition: v-bind(columnTransition);
    }
  }
}
</style>
