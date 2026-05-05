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
      prop('variant').type('TagVariant').required().preset('primary').enum('primary', 'secondary', 'tertiary').widget(),
      prop('term').str().widget(),
      slot(),
      slot('term'),
      setting('slot').preset('Label').widget(),
      setting('term').preset('term').widget(),
    ]"
  >
    <UiTag v-bind="properties">
      {{ settings.slot }}
      <template #term>
        {{ settings.term }}
      </template>
    </UiTag>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import UiTag from '@core/components/ui/tag/UiTag.vue'
</script>
