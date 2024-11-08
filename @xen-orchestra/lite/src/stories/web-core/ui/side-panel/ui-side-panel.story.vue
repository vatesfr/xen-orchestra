<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('busy').bool().widget(),
      prop('isError').bool().widget(),
      prop('isEmpty').bool().widget(),
      setting('action1').widget(text()).preset('Edit'),
      setting('action2').widget(text()).preset('Delete'),
      slot(),
      slot('actions').help('Meant to receive UiButton'),
      slot('content').help('Meant to display cards or other component'),
    ]"
    :presets="{
      Normal: {
        props: {
          busy: false,
          isError: false,
          isEmpty: false,
        },
      },
      Empty: {
        props: {
          busy: false,
          isError: false,
          isEmpty: true,
        },
      },
      Error: {
        props: {
          busy: false,
          isError: true,
        },
      },
      Busy: {
        props: {
          busy: true,
          isError: false,
        },
      },
    }"
  >
    <UiSidePanel v-bind="properties">
      <template v-if="!properties.isEmpty" #actions>
        <UiButton variant="tertiary" size="medium" accent="info" :left-icon="faEdit"> {{ settings.action1 }}</UiButton>
        <UiButton variant="tertiary" size="medium" accent="danger" :left-icon="faTrash">
          {{ settings.action2 }}
        </UiButton>
        <UiButton variant="tertiary" size="medium" accent="info"> Button 3</UiButton>
        <UiButton variant="tertiary" size="medium" accent="info"> Button 4</UiButton>
        <UiButton variant="tertiary" size="medium" accent="info"> Button 5</UiButton>
        <UiButton variant="tertiary" size="medium" accent="info"> Button 6</UiButton>
        <UiButton variant="tertiary" size="medium" accent="info"> Button 7</UiButton>
      </template>
      <template v-if="!properties.isEmpty" #content>
        <UiCard>
          <div>Content 1</div>
          <div>Content 1</div>
          <div>Content 1</div>
        </UiCard>
        <UiCard>
          <div>Content 2</div>
          <div>Content 2</div>
          <div>Content 2</div>
        </UiCard>
        <UiCard>
          <div>Content 3</div>
          <div>Content 3</div>
          <div>Content 3</div>
        </UiCard>
      </template>
    </UiSidePanel>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiSidePanel from '@core/components/ui/side-panel/UiSidePanel.vue'
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons'
</script>
