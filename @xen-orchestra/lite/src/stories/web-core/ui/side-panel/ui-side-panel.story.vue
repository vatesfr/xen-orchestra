<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('state').type('states').enum('normal', 'empty', 'loading', 'error').preset('info').required().widget(),
      prop('busy').bool().widget(),
      prop('isError').bool().widget(),
      setting('actions').widget(text()).preset('Button'),
      setting('isEmpty').widget(boolean()),
      slot(),
      slot('actions').help('Meant to receive UiButton'),
      slot('content').help('Meant to display cards or other component'),
    ]"
    :presets="{
      Normal: {
        props: {
          busy: false,
          error: false,
        },
      },
    }"
  >
    <UiSidePanel v-bind="properties">
      <template #actions>
        <UiButton variant="tertiary" size="medium" accent="info">
          {{ settings.actions }}
        </UiButton>
        <UiButton variant="tertiary" size="medium" accent="info">
          {{ settings.actions }}
        </UiButton>
      </template>
      <template #content>
        <UiCard v-if="!settings.isEmpty">
          <div>Content 1</div>
          <div>Content 2</div>
          <div>Content 3</div>
        </UiCard>
        <UiCard v-if="!settings.isEmpty">
          <div>Content 1</div>
          <div>Content 2</div>
          <div>Content 3</div>
        </UiCard>
        <UiCard v-if="!settings.isEmpty">
          <div>Content 1</div>
          <div>Content 2</div>
          <div>Content 3</div>
        </UiCard>
      </template>
    </UiSidePanel>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { boolean, text } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiSidePanel from '@core/components/ui/side-panel/UiSidePanel.vue'
</script>
