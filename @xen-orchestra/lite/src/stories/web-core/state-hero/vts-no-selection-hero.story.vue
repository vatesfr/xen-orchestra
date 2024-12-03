<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('type').required().enum('page', 'card', 'panel').preset('card').widget()]"
  >
    <VtsNoSelectionHero v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
</script>
