<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('size').enum('small', 'large').preset('large').widget(),
      prop('variant').enum('small', 'medium').widget(),
      prop('info').str().widget().preset('message'),
      slot().help('Meant to display the title'),
      slot('action').help('Meant to receive UiButton or ButtonIcon components that will trigger actions'),
      setting('default').preset('Label').widget(),
      setting('showDemoButtons').widget(boolean()),
    ]"
  >
    <UiTitle v-bind="properties">
      {{ settings.default }}

      <template v-if="settings.showDemoButtons" #action>
        <UiButton size="medium" variant="secondary" accent="brand">Label</UiButton>
      </template>
    </UiTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { boolean } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
</script>
