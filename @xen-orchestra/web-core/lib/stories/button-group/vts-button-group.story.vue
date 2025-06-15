<template>
  <ComponentStory :params>
    <VtsButtonGroup v-bind="bindings">
      <UiButton variant="secondary" accent="brand" size="medium">Cancel</UiButton>
      <UiButton variant="primary" accent="brand" size="medium">Call to action</UiButton>
      <template #tertiary>
        <UiButton variant="tertiary" accent="warning" size="medium">Secondary call to action</UiButton>
      </template>
    </VtsButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  slots: {
    default: { help: 'Meant to receive UiButton components' },
    tertiary: { help: 'Meant to receive a third UiButton component, it will be on a second row' },
  },
})
</script>
