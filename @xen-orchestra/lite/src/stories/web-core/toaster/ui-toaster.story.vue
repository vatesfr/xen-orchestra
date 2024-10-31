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
      prop('actionType').type('Type').enum('button', 'link').preset('button').required().widget(),
      setting('label').widget(text()).preset('Migration successful!'),
      setting('description').widget(text()).preset('All went well. 3 VMs have been successfully migrate.'),
      setting('actions').widget(text()).preset('See tasks'),
    ]"
  >
    <UiToaster v-bind="properties">
      {{ settings.label }}
      <template #description>{{ settings.description }}</template>
      <template #actions>
        <UiButton
          v-if="properties.actionType === 'button'"
          level="tertiary"
          size="medium"
          :color="properties.accent === 'danger' ? 'danger' : 'normal'"
        >
          {{ settings.actions }}
        </UiButton>
        <ObjectLink v-else class="typo p1-regular" route="#">See tasks</ObjectLink>
      </template>
    </UiToaster>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiButton from '@core/components/button/UiButton.vue'
import ObjectLink from '@core/components/object-link/ObjectLink.vue'
import UiToaster from '@core/components/ui/toaster/UiToaster.vue'
</script>
