<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      slot(),
      setting('leftSlotContent').preset('Legend subtitle').widget(text()),
      setting('rightSlotContent').preset('Info').widget(text()),
    ]"
  >
    <CardSubtitle
      ><template #left>{{ settings.leftSlotContent }}</template>
      <template #right>{{ settings.rightSlotContent }}</template>
    </CardSubtitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot, setting } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import CardSubtitle from '@core/components/card/CardSubtitle.vue'
</script>
