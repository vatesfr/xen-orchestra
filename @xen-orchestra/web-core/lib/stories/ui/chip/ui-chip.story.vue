<template>
  <ComponentStory :params>
    <UiChip v-bind="bindings">{{ settings.slotContent }}</UiChip>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiChip, { type ChipAccent } from '@core/components/ui/chip/UiChip.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      preset: 'info' as ChipAccent,
      widget: choice('info', 'success', 'warning', 'danger'),
      required: true,
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  events: {
    edit: {},
    remove: {},
  },
  slots: {
    default: {},
  },
  settings: {
    slotContent: {
      preset: 'State: in progress',
    },
  },
})
</script>
