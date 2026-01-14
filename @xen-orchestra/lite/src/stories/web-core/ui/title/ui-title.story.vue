<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      slot().help('Meant to display the title'),
      slot('action').help('Meant to receive UiButton or ButtonIcon component that will trigger action'),
      setting('default').preset('Label').widget(),
      setting('showDemoButton').widget(boolean()),
    ]"
  >
    <UiTitle v-bind="properties">
      {{ settings.default }}

      <template v-if="settings.showDemoButton" #action>
        <UiButton size="medium" variant="secondary" accent="brand">Label</UiButton>
      </template>
    </UiTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import { boolean } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
</script>
