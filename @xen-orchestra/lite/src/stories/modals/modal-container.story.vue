<template>
  <ComponentStory :params>
    <ModalContainer v-bind="bindings">
      <template #header>
        {{ settings.headerSlotContent }}
      </template>

      <template #default>
        {{ settings.defaultSlotContent }}
        <ModalContainer v-if="settings.showNested" color="error"> Nested modal </ModalContainer>
      </template>

      <template #footer>
        {{ settings.footerSlotContent }}
      </template>
    </ModalContainer>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ModalContainer from '@/components/ui/modals/ModalContainer.vue'
import type { Color } from '@/types'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { boolean, choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    color: {
      preset: ref<Color>(),
      type: 'Color',
      widget: choice('info', 'error', 'warning', 'success'),
    },
  },
  slots: {
    header: {},
    default: {},
    footer: {},
  },
  settings: {
    headerSlotContent: { preset: 'Header' },
    defaultSlotContent: { preset: 'Content' },
    footerSlotContent: { preset: 'Footer' },
    showNested: { preset: false, widget: boolean(), help: 'Show nested modal' },
  },
})
</script>
