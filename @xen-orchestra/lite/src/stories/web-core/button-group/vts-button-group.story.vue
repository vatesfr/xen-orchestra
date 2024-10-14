<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      slot().help('Meant to receive UiButton components'),
      slot('tertiary').help('Meant to receive a third UiButton component, it will be on a second row'),
    ]"
  >
    <VtsButtonGroup v-bind="properties">
      <UiButton variant="secondary" accent="info" size="medium">Cancel</UiButton>
      <UiButton variant="primary" accent="info" size="medium">Call to action</UiButton>
      <template #tertiary>
        <UiButton variant="tertiary" accent="warning" size="medium">Secondary call to action</UiButton>
      </template>
    </VtsButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import UiButton from '@core/components/ui/button/UiButton.vue'
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
</script>
