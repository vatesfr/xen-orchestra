<template>
  <ComponentStory :params :presets>
    <StoryExampleComponent v-bind="bindings">
      {{ settings.defaultSlotContent }}
      <div>Default model value: {{ bindings.modelValue }}</div>
      <div>Custom model value: {{ bindings.customModel }}</div>
      <template #named-slot>
        {{ settings.namedSlotContent }}
      </template>
      <template #named-scoped-slot="{ moonDistance }">
        {{ settings.namedScopedSlotContent }} (scope value: {{ moonDistance }})
      </template>
    </StoryExampleComponent>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import StoryExampleComponent from '@core/packages/story/StoryExampleComponent.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    imString: {
      preset: 'Example',
      required: true,
      help: 'This is a required string prop',
    },
    imNumber: {
      preset: 42,
      required: true,
      help: 'This is a required number prop',
    },
    imOptional: {
      preset: ref<string>(),
      type: 'string',
      help: 'This is an optional string prop',
    },
    imOptionalWithDefault: {
      preset: ref<string>(),
      default: 'Hi World',
    },
  },
  models: {
    modelValue: {
      preset: ref<string>(),
      type: 'string',
    },
    customModel: {
      preset: ref<string>(),
      type: 'string',
    },
  },
  events: {
    click: { help: 'Emitted when the user click the first button' },
    clickWithArg: {
      args: { id: 'string' },
      help: 'Emitted when the user click the second button',
    },
  },
  slots: {
    default: { help: 'This is the default slot' },
    'named-slot': { help: 'This is a named slot' },
    'named-scoped-slot': {
      help: 'This is a named slot',
      props: { moonDistance: 'number' },
    },
  },
  settings: {
    defaultSlotContent: { preset: 'Content for default slot' },
    namedSlotContent: { preset: 'Content for named slot' },
    namedScopedSlotContent: { preset: 'Content for named scoped slot' },
  },
})

const presets: Record<string, () => void> = {
  'Demo preset': () => {
    bindings.imString = 'Text from preset'
    bindings.imNumber = 1000
    settings.defaultSlotContent = 'Preset content for default slot'
    settings.namedSlotContent = 'Preset content for named slot'
    settings.namedScopedSlotContent = 'Preset content for named scoped slot'
  },
}
</script>
