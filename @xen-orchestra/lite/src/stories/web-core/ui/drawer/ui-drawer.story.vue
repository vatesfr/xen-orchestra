<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('isOpen').bool().widget(),
      prop('onDismiss').bool().widget().help('Show dismiss button and enable backdrop click'),
      event('dismiss').help('Emitted when dismiss button or backdrop is clicked'),
      event('submit').args({ event: 'SubmitEvent' }).help('Emitted when the form is submitted'),
      slot('title').help('Drawer title'),
      slot('content').help('Main content area'),
      slot('buttons').help('Footer buttons area'),
      setting('titleContent').widget(text()).preset('Drawer Title'),
      setting('mainContent').widget(text()).preset('This is the drawer content.'),
      setting('showButtons').widget(boolean()).preset(true),
    ]"
    :presets="{
      Dismissible: {
        props: {
          isOpen: true,
          onDismiss: true,
        },
      },
      Persistent: {
        props: {
          isOpen: true,
          onDismiss: false,
        },
      },
    }"
  >
    <UiButton variant="primary" accent="brand" size="medium" @click="isOpen = true">Open Drawer</UiButton>

    <UiDrawer
      :is-open="isOpen"
      v-on="{
        dismiss: properties.onDismiss ? () => (isOpen = false) : undefined,
        submit: handleSubmit,
      }"
    >
      <template #title>{{ settings.titleContent }}</template>
      <template #content>
        <p>{{ settings.mainContent }}</p>
      </template>
      <template v-if="settings.showButtons" #buttons>
        <UiButton v-if="properties.onDismiss" variant="secondary" accent="brand" size="medium" @click="isOpen = false">
          Cancel
        </UiButton>
        <UiButton variant="primary" accent="brand" size="medium" type="submit">Confirm</UiButton>
      </template>
    </UiDrawer>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, setting, slot } from '@/libs/story/story-param'
import { boolean, text } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { ref } from 'vue'

const isOpen = ref(false)

function handleSubmit(event: SubmitEvent) {
  event.preventDefault()
  isOpen.value = false
}
</script>
