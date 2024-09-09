<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('type').required().enum('page', 'card').preset('card').widget()]"
  >
    <NoDataHero v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import NoDataHero from '@core/components/state-hero/NoDataHero.vue'
</script>
