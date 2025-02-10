<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').type('ButtonAccent').enum('brand', 'warning', 'danger').preset('brand').required().widget(),
      prop('variant')
        .type('ButtonVariant')
        .enum('primary', 'secondary', 'tertiary')
        .preset('primary')
        .required()
        .widget(),
      prop('size').type('ButtonSize').enum('small', 'medium').preset('medium').required().widget(),
      prop('busy').bool().widget(),
      prop('disabled').bool().widget().ctx(),
      prop('lockIcon').bool().widget(),
      prop('leftIcon')
        .type('IconDefinition')
        .widget(
          choice(
            { label: 'Ship', value: faShip },
            { label: 'Rocket', value: faRocket },
            { label: 'Floppy', value: faFloppyDisk },
            { label: 'Trash', value: faTrash }
          )
        ),
      setting('label').preset('Click me').widget(),
    ]"
    :presets="{
      'Save Button': {
        props: {
          accent: 'success',
          leftIcon: faFloppyDisk,
          rightIcon: undefined,
        },
        settings: {
          label: 'Save',
        },
      },
      'Delete Button': {
        props: {
          leftIcon: undefined,
          rightIcon: faTrash,
          accent: 'danger',
        },
        settings: {
          label: 'Delete',
        },
      },
    }"
  >
    <UiButton v-bind="properties">{{ settings.label }}</UiButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting } from '@/libs/story/story-param'
import { choice } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { faFloppyDisk, faRocket, faShip, faTrash } from '@fortawesome/free-solid-svg-icons'
</script>
