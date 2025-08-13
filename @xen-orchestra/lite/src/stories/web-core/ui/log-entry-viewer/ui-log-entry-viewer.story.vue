<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('label').required().preset('Label').widget(),
      prop('accent').type('QuoteCodeAccent').enum('info', 'warning', 'danger').required().preset('info').widget(),
      prop('size').type('QuoteCodeSize').enum('small', 'medium').required().preset('small').widget(),
      slot().help('Meant to display the code'),
      setting('default')
        .preset(
          'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur, labore, repellendus. Accusantium fuga inventore ipsa necessitatibus perspiciatis sit tempora.'
        )
        .widget(),
    ]"
  >
    <UiLogEntryViewer v-bind="properties">
      {{ settings.default }}
    </UiLogEntryViewer>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param.ts'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
</script>
