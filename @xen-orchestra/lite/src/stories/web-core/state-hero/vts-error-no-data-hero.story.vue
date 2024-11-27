<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('type').required().enum('page', 'card', 'table', 'panel').preset('card').widget()]"
  >
    <VtsErrorNoDataHero v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
</script>
