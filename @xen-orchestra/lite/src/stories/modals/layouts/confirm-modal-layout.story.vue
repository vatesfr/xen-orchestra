<template>
  <ComponentStory :params>
    <ConfirmModalLayout v-bind="bindings">
      <template #title>{{ settings.titleSlot }}</template>
      <template #subtitle>{{ settings.subtitleSlot }}</template>
      <template #buttons>
        <UiButton accent="brand" size="medium" variant="secondary">I prefer not</UiButton>
        <UiButton accent="brand" size="medium" variant="primary">Yes, I'm sure!</UiButton>
      </template>
    </ConfirmModalLayout>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ConfirmModalLayout from '@/components/ui/modals/layouts/ConfirmModalLayout.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { faServer } from '@fortawesome/free-solid-svg-icons'

const { params, bindings, settings } = useStory({
  props: {
    icon: {
      preset: faServer,
      type: 'IconDefinition',
      widget: iconChoice(),
    },
  },
  slots: {
    title: { help: 'Title slot content' },
    subtitle: { help: 'Subtitle slot content' },
    default: { help: 'Default slot content' },
    buttons: { help: 'Meant to receive UiButton components' },
  },
  settings: {
    titleSlot: {
      preset: 'Do you confirm?',
    },
    subtitleSlot: {
      preset: 'You should be sure about this',
    },
  },
})
</script>
