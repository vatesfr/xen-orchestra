<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('type').required().enum('page', 'card').preset('card').widget()]"
  >
    <ComingSoonHero v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import ComingSoonHero from '@core/components/state-hero/ComingSoonHero.vue'
</script>
