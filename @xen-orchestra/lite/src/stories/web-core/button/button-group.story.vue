<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      slot().help('Meant to receive UiButton components'),
      slot('tertiary').help('Meant to receive a third UiButton component, it will be on a second row'),
    ]"
  >
    <ButtonGroup v-bind="properties">
      <UiButton level="secondary">Cancel</UiButton>
      <UiButton>Call to action</UiButton>
      <template #tertiary>
        <UiButton level="tertiary" color="warning">Secondary call to action</UiButton>
      </template>
    </ButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import ButtonGroup from '@core/components/button/ButtonGroup.vue'
import UiButton from '@core/components/button/UiButton.vue'
</script>
