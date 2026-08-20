<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .type('LegendItemAccent')
        .required()
        .preset('info')
        .enum('info', 'secondary', 'success', 'warning', 'danger', 'muted')
        .widget(),
      prop('value').num().widget().preset(4),
      prop('unit').str().preset('GB').widget(),
      prop('onInfoClick').type('() => void'),
      slot(),
      setting('withInfoButton').preset(true).widget(boolean()),
      setting('slot').preset('Legend label').widget(text()),
    ]"
  >
    <VtsLegendList>
      <UiLegend v-bind="properties" :on-info-click="settings.withInfoButton ? openLegendModal : undefined">
        {{ settings.slot }}
      </UiLegend>
    </VtsLegendList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { boolean, text } from '@/libs/story/story-widget'
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiLegend from '@core/components/ui/legend/UiLegend.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

const { open: openLegendModal } = useOverlay({
  component: () => import('@/stories/web-core/ui/legend/LegendInfoModal.vue'),
  events: {
    onClose: true,
  },
})
</script>
