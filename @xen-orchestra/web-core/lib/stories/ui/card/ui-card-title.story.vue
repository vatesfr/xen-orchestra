<template>
  <ComponentStory :params>
    <UiCardTitle v-bind="bindings">
      {{ settings.defaultSlotContent }}
      <UiCounter :value="3" accent="danger" size="medium" variant="primary" />
      <template #info>
        {{ settings.infoSlotContent }}
        <UiButton :right-icon="faAngleRight" accent="brand" size="small" variant="tertiary">See all</UiButton>
      </template>
      <template #description>{{ settings.descriptionSlotContent }}</template>
    </UiCardTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'

const { params, bindings, settings } = useStory({
  slots: {
    default: { help: 'Meant to receive the title and a UiCounter' },
    info: { help: 'Meant to receive an info text and / or a tertiary UiButton' },
    description: { help: 'Meant to receive a description text, will be displayed under the title' },
  },
  settings: {
    defaultSlotContent: {
      preset: 'Title',
    },
    infoSlotContent: {
      preset: 'Info',
    },
    descriptionSlotContent: {
      preset: 'Description',
    },
  },
})
</script>
