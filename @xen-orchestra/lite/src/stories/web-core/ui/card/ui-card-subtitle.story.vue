<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      slot(),
      slot('info').help('Meant to receive an info text'),
      setting('defaultSlotContent').preset('Subtitle').widget(text()),
      setting('infoSlotContent').preset('Info').widget(text()),
    ]"
  >
    <UiCardSubtitle>
      {{ settings.defaultSlotContent }}
      <template #info>{{ settings.infoSlotContent }}</template>
    </UiCardSubtitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot, setting } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
</script>
