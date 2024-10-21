<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      slot().help('Meant to receive the title and a UiCounter'),
      slot('info').help('Meant to receive an info text and / or a tertiary VtsButton'),
      slot('description').help('Meant to receive a description text, will be displayed under the title'),
      setting('defaultSlotContent').preset('Title').widget(text()),
      setting('infoSlotContent').preset('Info').widget(text()),
      setting('descriptionSlotContent').preset('Description').widget(text()),
    ]"
  >
    <CardTitle v-bind="properties">
      {{ settings.defaultSlotContent }}
      <VtsCounter :value="3" accent="danger" size="medium" variant="primary" />
      <template #info>
        {{ settings.infoSlotContent }}
        <VtsButton level="tertiary" size="small" color="normal" :right-icon="faAngleRight">See all</VtsButton>
      </template>
      <template #description>{{ settings.descriptionSlotContent }}</template>
    </CardTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot, setting } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsButton from '@core/components/button/VtsButton.vue'
import CardTitle from '@core/components/card/CardTitle.vue'
import VtsCounter from '@core/components/counter/VtsCounter.vue'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
</script>
