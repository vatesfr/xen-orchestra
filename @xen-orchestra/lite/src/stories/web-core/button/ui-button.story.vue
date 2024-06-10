<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      colorProp().ctx(),
      prop('level')
        .type('ButtonVariant')
        .default('primary')
        .widget(choice('primary', 'secondary', 'tertiary')),
      prop('size')
        .type('ButtonSize')
        .default('small')
        .widget(choice('extra-small', 'small', 'medium')),
      prop('busy').bool().widget(),
      prop('disabled').bool().widget().ctx(),
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
      prop('rightIcon')
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
          color: 'success',
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
          color: 'error',
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
import { colorProp, prop, setting } from '@/libs/story/story-param'
import { choice } from '@/libs/story/story-widget'
import UiButton from '@core/components/button/UiButton.vue'
import { faFloppyDisk, faRocket, faShip, faTrash } from '@fortawesome/free-solid-svg-icons'
</script>
