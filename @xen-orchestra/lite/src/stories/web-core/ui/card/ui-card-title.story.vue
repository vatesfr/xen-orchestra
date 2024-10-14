<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      slot().help('Meant to receive the title and a UiCounter'),
      slot('info').help('Meant to receive an info text and / or a tertiary UiButton'),
      slot('description').help('Meant to receive a description text, will be displayed under the title'),
      setting('defaultSlotContent').preset('Title').widget(text()),
      setting('infoSlotContent').preset('Info').widget(text()),
      setting('descriptionSlotContent').preset('Description').widget(text()),
    ]"
  >
    <UiCardTitle v-bind="properties">
      {{ settings.defaultSlotContent }}
      <UiCounter :value="3" accent="danger" size="medium" variant="primary" />
      <template #info>
        {{ settings.infoSlotContent }}
      </template>        <UiButton variant="tertiary" size="small" accent="normal" :right-icon="faAngleRight">See all</UiButton>
      <template #description>{{ settings.descriptionSlotContent }}</template>
    </UiCardTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot, setting } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
</script>
