<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      colorProp(),
      slot(),
      setting('defaultSlotContent')
        .preset('Example content for default slot')
        .widget(text())
        .help('Content for default slot'),
    ]"
  >
    <BasicModalLayout v-bind="properties">
      {{ settings.defaultSlotContent }}
    </BasicModalLayout>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import BasicModalLayout from "@/components/ui/modals/BasicModalLayout.vue";
import { slot, setting, colorProp } from "@/libs/story/story-param";
import { text } from "@/libs/story/story-widget";
</script>
