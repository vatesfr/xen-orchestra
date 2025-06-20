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
      iconProp('leftIcon'),
      setting('label').preset('Click me').widget(),
    ]"
    :presets="{
      'Save Button': {
        props: {
          accent: 'brand',
          leftIcon: 'fa:floppy-disk',
          rightIcon: undefined,
        },
        settings: {
          label: 'Save',
        },
      },
      'Delete Button': {
        props: {
          leftIcon: undefined,
          rightIcon: 'fa:trash',
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
import { iconProp, prop, setting } from '@/libs/story/story-param'
import UiButton from '@core/components/ui/button/UiButton.vue'
</script>
