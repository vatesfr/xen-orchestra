<template>
  <ComponentStory :params>
    <UiDropdownButton v-bind="bindings">{{ settings.slotContent }}</UiDropdownButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    selected: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: {},
  },
  settings: {
    slotContent: {
      preset: 'Dropdown title',
    },
  },
})
</script>
