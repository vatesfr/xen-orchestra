<template>
  <ComponentStory :params>
    <UiTextarea v-bind="bindings">
      {{ settings.defaultSlot }}
      <template v-if="settings.infoSlot" #info>{{ settings.infoSlot }}</template>
    </UiTextarea>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiTextarea, { type TextareaAccent } from '@core/components/ui/text-area/UiTextarea.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      preset: 'brand' as TextareaAccent,
      type: 'TextareaAccent',
      widget: choice<TextareaAccent>('brand', 'warning', 'danger'),
      required: true,
    },
    id: {
      preset: ref<string>(),
      type: 'string',
      widget: false,
    },
    maxCharacters: {
      preset: ref<number>(),
      type: 'number',
      help: 'When used, it will display the character count under the input',
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    href: {
      preset: ref<string>(),
      type: 'string',
      help: 'Add a "Learn more" link',
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    required: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  models: {
    modelValue: {
      preset: '',
      type: 'string',
    },
  },
  slots: {
    default: {},
    info: {},
  },
  settings: {
    defaultSlot: {
      preset: 'Some label',
    },
    infoSlot: {
      preset: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
  },
})
</script>
