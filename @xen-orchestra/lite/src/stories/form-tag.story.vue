<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      model()
        .required()
        .type('string[]')
        .help('List of selected tags (including created ones)'),
      model('createdTags').type('string[]').help('List of created tags'),
      prop('options')
        .required()
        .arr('string')
        .preset(availableTags)
        .help('List of available tags')
        .widget(object()),
      prop('allowNew').bool().help('Allow to create new tags').widget(),
      colorProp(),
    ]"
  >
    <FormTag v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import FormTag from "@/components/form/FormTag.vue";
import { colorProp, model, prop } from "@/libs/story/story-param";
import { object } from "@/libs/story/story-widget";

const availableTags = ["First tag", "Second tag", "Third tag"];
</script>
