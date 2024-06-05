<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      slot(),
      setting('defaultSlotContent').preset('Legend subtitle').widget(text()),
      setting('rightSlotContent').preset('Info').widget(text()),
    ]"
  >
    <CardSubtitle
      ><template #left>{{ settings.defaultSlotContent }}</template>
      <template #right>{{ settings.rightSlotContent }}</template>
    </CardSubtitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot, setting } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import CardSubtitle from '@core/components/card/CardSubtitle.vue'
</script>
