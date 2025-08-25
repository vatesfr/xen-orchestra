<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').required().preset('Label').widget(),
      prop('content')
        .type(`string | object | undefined`)
        .required()
        .preset(
          'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur, labore, repellendus. Accusantium fuga inventore ipsa necessitatibus perspiciatis sit tempora.'
        )
        .widget(object()),
      prop('accent').type('LogEntryViewerAccent').enum('info', 'warning', 'danger').required().preset('info').widget(),
      prop('size').type('LogEntryViewerSize').enum('small', 'medium').required().preset('small').widget(),
    ]"
  >
    <UiLogEntryViewer v-bind="properties" />
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param.ts'
import { object } from '@/libs/story/story-widget.ts'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
</script>
