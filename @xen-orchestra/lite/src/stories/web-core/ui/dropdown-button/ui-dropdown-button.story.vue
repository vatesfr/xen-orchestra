<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('icon')
        .type('IconDefinition')
        .widget(
          choice(
            { label: 'Ship', value: faShip },
            { label: 'Rocket', value: faRocket },
            { label: 'Floppy', value: faFloppyDisk },
            { label: 'Filter', value: faFilter }
          )
        ),
      prop('selected').bool().widget(),
      prop('disabled').bool().widget().ctx(),
      slot(),
      setting('defaultSlotContent').preset('Dropdown title').widget(text()).help('Content for default slot'),
    ]"
  >
    <UiDropdownButton v-bind="properties">{{ settings.defaultSlotContent }}</UiDropdownButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { choice, text } from '@/libs/story/story-widget'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { faFloppyDisk, faRocket, faShip, faFilter } from '@fortawesome/free-solid-svg-icons'
</script>
