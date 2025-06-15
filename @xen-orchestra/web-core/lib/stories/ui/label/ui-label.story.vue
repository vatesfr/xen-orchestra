<template>
  <ComponentStory :params>
    <UiLabel v-bind="bindings">{{ settings.defaultSlot }}</UiLabel>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiLabel, { type LabelAccent } from '@core/components/ui/label/UiLabel.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      preset: 'neutral' as LabelAccent,
      widget: choice<LabelAccent>('neutral', 'warning', 'danger'),
      required: true,
    },
    for: {
      preset: ref<string>(),
      type: 'string',
      widget: false,
    },
    icon: {
      preset: ref<IconDefinition>(),
      widget: iconChoice(),
    },
    required: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    href: {
      preset: ref<string>(),
      type: 'string',
      help: 'Add a "Learn more" link to the label',
    },
  },
  slots: {
    default: {},
  },
  settings: {
    defaultSlot: {
      preset: 'Slot content',
    },
  },
})
</script>
