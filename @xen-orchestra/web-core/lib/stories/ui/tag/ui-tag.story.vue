<template>
  <ComponentStory :params>
    <UiTag v-bind="bindings">{{ settings.slotContent }}</UiTag>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiTag, { type TagAccent, type TagVariant } from '@core/components/ui/tag/UiTag.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      preset: 'info' as TagAccent,
      type: 'TagAccent',
      required: true,
      widget: choice<TagAccent>('info', 'neutral', 'success', 'warning', 'danger', 'muted'),
    },
    variant: {
      preset: 'primary' as TagVariant,
      type: 'TagVariant',
      required: true,
      widget: choice<TagVariant>('primary', 'secondary'),
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
  },
  slots: {
    default: { help: 'Tag content' },
  },
  settings: {
    slotContent: {
      preset: 'Label',
    },
  },
})
</script>
