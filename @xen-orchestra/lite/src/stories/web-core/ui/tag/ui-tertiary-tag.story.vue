<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .type('TagAccent')
        .required()
        .preset('info')
        .enum('brand', 'info', 'neutral', 'success', 'warning', 'danger', 'muted')
        .widget(),
      prop('truncate')
        .bool()
        .widget()
        .help('Keeps the tag on one line: the longer part ends with an ellipsis first, the shorter one stays whole'),
      prop('wrap').bool().widget().help('Stacks the term above the value when they do not fit on one line'),
      slot(),
      slot('term'),
      setting('slot').preset('Label').widget(),
      setting('term').preset('term').widget(),
      setting('maxWidth').widget(number()).help('Maximum width, in rem'),
    ]"
  >
    <UiTertiaryTag v-bind="properties" :style="{ maxWidth: settings.maxWidth ? `${settings.maxWidth}rem` : undefined }">
      {{ settings.slot }}
      <template #term>
        {{ settings.term }}
      </template>
    </UiTertiaryTag>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param.ts'
import { number } from '@/libs/story/story-widget.ts'
import UiTertiaryTag from '@core/components/ui/tag/UiTertiaryTag.vue'
</script>
