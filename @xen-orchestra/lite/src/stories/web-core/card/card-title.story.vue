<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      slot(),
      slot('info').help('Meant to receive an info text'),
      slot('link').help('Meant to receive a tertiary button'),
      slot('description').help('Meant to receive a description text, will be displayed under the title'),
      setting('defaultSlotContent').preset('Legend title').widget(text()),
      setting('infoSlotContent').preset('Info').widget(text()),
      setting('descriptionSlotContent').preset('Description').widget(text()),
    ]"
  >
    <CardTitle v-bind="properties"
      >Title<UiCounter :value="13" color="danger" size="medium" />
      <template #info
        ><UiButton level="tertiary" size="extra-small" :right-icon="faAngleRight">See all</UiButton></template
      >
      <template #description>{{ settings.descriptionSlotContent }} </template>
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
