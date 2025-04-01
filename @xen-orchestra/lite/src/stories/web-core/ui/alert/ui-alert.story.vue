<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .type('AlertAccent')
        .enum('info', 'success', 'warning', 'danger')
        .preset('info')
        .required()
        .widget(),
      prop('close').bool().widget(),
      setting('label')
        .widget(text())
        .preset(
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
            'Curabitur aliquam nibh a tortor feugiat ornare. Aliquam quis ultrices ipsum,' +
            ' sit amet imperdiet enim. Nullam lobortis malesuada tempor. In lobortis lacus ' +
            'ut odio elementum, nec egestas ante accumsan. Cras tempus metus quis ipsum pretium, ' +
            'non venenatis mi aliquam.'
        ),
      setting('description').widget(text()).preset('description!'),
      slot(),
      slot('description').help('Meant to display description (even a table) under the label'),
      event('close'),
    ]"
  >
    <UiAlert v-bind="properties">
      {{ settings.label }}
      <template #description>{{ settings.description }}</template>
    </UiAlert>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
</script>
