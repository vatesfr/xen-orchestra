<template>
  <ComponentStory
    v-slot="{ properties }"
    full-width-component
    :params="[
      prop('hasSelection')
        .bool()
        .widget()
        .preset(true)
        .help('Opens / closes the panel with the selection where it is not pinned (and on small screens)'),
      prop('persistent')
        .bool()
        .widget()
        .preset(false)
        .help(
          'For a panel that always has something to show: renders its content even without a selection, and shows the close button only where closing collapses it (small screen, or not pinned)'
        ),
      event('close').args({}).help('Emitted when the user clicks the close button'),
      slot().help('The panel content, replaced by the no-selection state hero without a selection unless persistent'),
      slot('actions').help('For the main action buttons'),
      slot('more-actions').help('For other action buttons, shown in a dropdown menu'),
      slot('corner-actions').help('For action icon buttons, next to the pin button'),
    ]"
  >
    <div class="layout">
      <UiButton
        v-if="!panelStore.isExpanded"
        accent="brand"
        variant="secondary"
        size="medium"
        @click="panelStore.expand()"
      >
        Expand panel
      </UiButton>
      <VtsSidePanel v-bind="properties">
        <UiPanelCard>
          <div>Card Content</div>
        </UiPanelCard>
      </VtsSidePanel>
    </div>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, slot } from '@/libs/story/story-param.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { usePanelStore } from '@core/stores/panel.store.ts'

const panelStore = usePanelStore()
</script>

<style scoped lang="postcss">
.layout {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1.6rem;
}
</style>
