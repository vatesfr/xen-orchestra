<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .type('TagAccent')
        .required()
        .preset('info')
        .enum('info', 'neutral', 'success', 'warning', 'danger', 'muted')
        .widget(),
      slot(),
      slot('term'),
      setting('slot').preset('Label').widget(),
      setting('term').preset('term').widget(),
    ]"
  >
    <UiTertiaryTag v-bind="properties">
      {{ settings.slot }}
      <template #term>
        {{ settings.term }}
      </template>
    </UiTertiaryTag>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import UiTertiaryTag from '@core/components/ui/tag/UiTertiaryTag.vue'
</script>
