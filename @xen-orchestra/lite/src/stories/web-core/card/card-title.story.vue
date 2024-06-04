<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('count').num().widget(),
      prop('counterColor').str().enum('info', 'error', 'success', 'warning', 'black').widget(),
      slot(),
      setting('defaultSlotContent').preset('Legend title').widget(text()),
      setting('rightSlotContent').preset('Info').widget(text()),
      setting('bottomLeftSlotContent').preset('Description').widget(text()),
    ]"
  >
    <CardTitle v-bind="properties"
      ><template #left>{{ settings.defaultSlotContent }}</template>
      <template #right>{{ settings.rightSlotContent }}</template>
      <template #bottom-left>{{ settings.bottomLeftSlotContent }}</template>
      <UiButton level="tertiary">Manage<UiIcon :icon="faAngleRight" color="info" /></UiButton>
    </CardTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot, setting } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import CardTitle from '@core/components/card/CardTitle.vue'
import UiButton from '@core/components/button/UiButton.vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
</script>
