<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .type('ToasterAccent')
        .enum('info', 'success', 'warning', 'danger')
        .preset('info')
        .required()
        .widget(),
      setting('label').widget(text()).preset('Migration successful!'),
      setting('description').widget(text()).preset('All went well. 3 VMs have been successfully migrate.'),
      setting('actions').widget(text()).preset('Label'),
      setting('showLink').widget(boolean()),
      slot(),
      slot('description').help('Meant to display description under the label'),
      slot('actions').help('Meant to receive UiButton or link components'),
    ]"
  >
    <UiToaster v-bind="properties">
      {{ settings.label }}
      <template #description>{{ settings.description }}</template>
      <template #actions>
        <UiObjectLink v-if="settings.showLink" class="link typo p1-regular" route="#">See tasks</UiObjectLink>
        <UiButton v-else variant="tertiary" size="medium" :accent="properties.accent === 'danger' ? 'danger' : 'info'">
          {{ settings.actions }}
        </UiButton>
      </template>
    </UiToaster>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { boolean, text } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiToaster from '@core/components/ui/toaster/UiToaster.vue'
</script>
