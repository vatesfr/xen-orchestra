<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('tag').str().default('span').widget(),
      colorProp().ctx(),
      slot(),
      setting('defaultSlotContent')
        .preset('Example content for default slot')
        .widget(text())
        .help('Content for default slot'),
    ]"
  >
    <UiAccent v-bind="properties">
      {{ settings.defaultSlotContent }}
    </UiAccent>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import UiAccent from "@/components/ui/UiAccent.vue";
import { prop, slot, setting, colorProp } from "@/libs/story/story-param";
import { text } from "@/libs/story/story-widget";
</script>
