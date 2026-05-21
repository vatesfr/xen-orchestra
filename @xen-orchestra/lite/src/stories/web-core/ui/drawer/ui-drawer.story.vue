<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('title').str().widget().preset('Drawer Title'),
      prop('isOpen').bool().widget(),
      prop('onDismiss').type('() => void').help('Show dismiss button and enable backdrop click'),
      event('dismiss').help('Emitted when dismiss button or backdrop is clicked'),
      slot('content').help('Main content area'),
      slot('buttons').help('Footer buttons area'),
      setting('dismissible').widget(boolean()).preset(true).help('Toggle dismiss behavior in this story'),
      setting('showButtons').widget(boolean()).preset(true),
    ]"
    :presets="{
      Dismissible: {
        props: { isOpen: true },
        settings: { dismissible: true },
      },
      Persistent: {
        props: { isOpen: true },
        settings: { dismissible: false },
      },
      'No title': {
        props: { isOpen: true, title: '' },
        settings: { dismissible: true },
      },
      'No buttons': {
        props: { isOpen: true },
        settings: { dismissible: true, showButtons: false },
      },
    }"
  >
    <UiButton variant="primary" accent="brand" size="medium" @click="isOpen = true">Open Drawer</UiButton>

    <UiDrawer
      :is-open
      :title="properties.title"
      :on-dismiss="settings.dismissible ? () => (isOpen = false) : undefined"
      @dismiss="isOpen = false"
    >
      <template #content>
        <p>This is the drawer content.</p>
      </template>
      <template v-if="settings.showButtons" #buttons>
        <UiButton v-if="settings.dismissible" variant="secondary" accent="brand" size="medium" @click="isOpen = false">
          Cancel
        </UiButton>
        <UiButton variant="primary" accent="brand" size="medium" @click="isOpen = false">Confirm</UiButton>
      </template>
    </UiDrawer>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, setting, slot } from '@/libs/story/story-param'
import { boolean } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { ref } from 'vue'

const isOpen = ref(false)
</script>
