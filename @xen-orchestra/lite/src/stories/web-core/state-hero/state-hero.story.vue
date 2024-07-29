<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('type').required().enum('page', 'card').preset('card').widget(),
      prop('busy').bool().widget(),
      prop('image').enum('no-result', 'under-construction').widget(),
      slot(),
      setting('defaultSlot').preset('Some text').widget(),
    ]"
  >
    <StateHero v-bind="properties">
      {{ settings.defaultSlot }}
    </StateHero>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import StateHero from '@core/components/state-hero/StateHero.vue'
</script>
