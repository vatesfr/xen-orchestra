<template>
  <ComponentStory :params>
    <UiObjectLink v-bind="bindings">{{ settings.slotContent }}</UiObjectLink>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { bindings, params, settings } = useStory({
  props: {
    route: {
      preset: 'dashboard',
      type: 'RouteLocationRaw',
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
  },
  slots: {
    default: {
      help: "Meant to receive the object's label",
    },
    icon: {
      help: 'Meant to receive a UiIcon or ObjectIcon component',
    },
  },
  settings: {
    slotContent: {
      preset: 'Pool name',
    },
  },
})
</script>
