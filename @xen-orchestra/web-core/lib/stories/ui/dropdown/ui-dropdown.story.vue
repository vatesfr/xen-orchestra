<template>
  <ComponentStory :params>
    <UiDropdownList>
      <UiDropdown v-bind="bindings">
        {{ settings.defaultSlotContent }}
      </UiDropdown>
    </UiDropdownList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiDropdown, { type DropdownAccent } from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { boolean, choice, text } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      preset: 'brand' as DropdownAccent,
      type: 'DropdownAccent',
      widget: choice('normal', 'brand', 'success', 'warning', 'danger'),
      required: true,
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    locked: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    selected: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    hover: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    checkbox: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    subMenuIcon: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    info: {
      preset: ref<string>(),
      type: 'string',
    },
  },
  slots: {
    icon: { help: 'You can use this slot to handle the icon by yourself' },
    default: {},
  },
  settings: {
    checkbox: {
      preset: ref<IconDefinition | undefined>(),
      widget: boolean(),
      help: 'Pass `checkbox` prop to `DropdownList`',
    },
    defaultSlotContent: {
      preset: 'Item label',
      widget: text(),
      help: 'Content for default slot',
    },
  },
})
</script>
