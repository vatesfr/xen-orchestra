<template>
  <ComponentStory :params>
    <UiAlert v-bind="bindings">
      {{ settings.label }}
      <template #description>{{ settings.description }}</template>
    </UiAlert>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiAlert, { type AlertAccent } from '@core/components/ui/alert/UiAlert.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      preset: ref<AlertAccent>('info'),
      type: 'AlertAccent',
      required: true,
      widget: choice('info', 'success', 'warning', 'danger'),
    },
    close: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  events: {
    close: {},
  },
  slots: {
    default: {},
    description: { help: 'Meant to display description (even a table) under the label' },
  },
  settings: {
    label: {
      preset:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
        'Curabitur aliquam nibh a tortor feugiat ornare. Aliquam quis ultrices ipsum,' +
        ' sit amet imperdiet enim. Nullam lobortis malesuada tempor. In lobortis lacus ' +
        'ut odio elementum, nec egestas ante accumsan. Cras tempus metus quis ipsum pretium, ' +
        'non venenatis mi aliquam.',
    },
    description: {
      preset: 'description!',
    },
  },
})
</script>
