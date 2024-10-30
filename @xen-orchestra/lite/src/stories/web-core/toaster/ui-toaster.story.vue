<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .type('ToasterColor')
        .enum('brand', 'success', 'warning', 'danger')
        .preset('brand')
        .required()
        .widget(),
      slot(),
      setting('label').widget(text()).preset('Label'),
      setting('description').widget(text()).preset('Description'),
      setting('actions').widget(text()).preset('Label'),
    ]"
  >
    <UiToaster v-bind="properties">
      {{ settings.label }}
      <template #description>{{ settings.description }}</template>
      <template #actions>
        <UiButton level="tertiary" size="medium" color="normal">{{ settings.actions }}</UiButton>
      </template>
    </UiToaster>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiButton from '@core/components/button/UiButton.vue'
import UiToaster from '@core/components/ui/toaster/UiToaster.vue'
</script>
