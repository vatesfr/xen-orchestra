<template>
  <ComponentStory :params>
    <UiToaster v-bind="bindings">
      {{ settings.defaultSlot }}
      <template #description>{{ settings.descriptionSlot }}</template>
      <template v-if="settings.action" #actions>
        <UiObjectLink v-if="settings.action === 'link'" class="link typo-body-regular" route="#">
          See tasks
        </UiObjectLink>
        <UiButton v-else :accent="bindings.accent === 'danger' ? 'danger' : 'brand'" size="medium" variant="tertiary">
          Some action
        </UiButton>
      </template>
    </UiToaster>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiToaster, { type ToasterAccent } from '@core/components/ui/toaster/UiToaster.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      preset: 'success' as ToasterAccent,
      type: 'ToasterAccent',
      widget: choice<ToasterAccent>('info', 'success', 'warning', 'danger'),
      required: true,
    },
  },
  events: {
    close: { help: 'Emitted when the close icon is clicked' },
  },
  slots: {
    default: {},
    description: { help: 'Meant to display description under the label' },
    actions: { help: 'Meant to receive UiButton or link components' },
  },
  settings: {
    defaultSlot: { preset: 'Migration successful!' },
    descriptionSlot: { preset: 'All went well. 3 VMs have been successfully migrate.' },
    action: {
      preset: '',
      widget: choice('', 'button', 'link'),
    },
  },
})
</script>
