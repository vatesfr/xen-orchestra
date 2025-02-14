<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('count').num().required().preset(10).widget(), prop('max').num().required().preset(200).widget()]"
    :presets="{
      'Exceeding max value': {
        props: {
          count: 250,
          max: 200,
        },
      },
    }"
  >
    <UiCharacterLimit v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiCharacterLimit from '@core/components/ui/character-limit/UiCharacterLimit.vue'
</script>
