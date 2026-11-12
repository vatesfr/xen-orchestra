<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('value')
        .str()
        .required()
        .preset('env=prod')
        .widget()
        .help('Tags in the `term=label` form are displayed as a tertiary tag'),
      prop('accent')
        .type('TagAccent')
        .enum('info', 'neutral', 'success', 'warning', 'danger', 'muted')
        .default('info')
        .widget(),
      prop('variant')
        .type('TagVariant')
        .enum('primary', 'secondary')
        .default('secondary')
        .widget()
        .help('Ignored when the tag is displayed as a tertiary tag'),
      prop('wrap')
        .bool()
        .widget()
        .help('Stacks the term above the value when they do not fit on one line (tertiary tag only)'),
    ]"
  >
    <VtsTag v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param.ts'
import VtsTag from '@core/components/tag/VtsTag.vue'
</script>
