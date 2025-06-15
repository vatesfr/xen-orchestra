<template>
  <ComponentStory :params>
    <UiDropdownList>
      <DropdownTitle v-bind="bindings">{{ settings.defaultSlotContent }}</DropdownTitle>
    </UiDropdownList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import DropdownTitle from '@core/components/dropdown/DropdownTitle.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice } from '@core/packages/story/story-widget.ts'
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
      preset: 'none' as const,
      type: '"all" | "some" | "none"',
      widget: choice('none', 'some', 'all'),
    },
  },
  events: {
    toggleSelectAll: {
      args: { value: 'boolean' },
    },
  },
  slots: {
    default: {},
  },
  settings: {
    defaultSlotContent: { preset: 'Dropdown title' },
  },
})
</script>
