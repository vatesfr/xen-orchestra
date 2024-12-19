<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('id').required().str().preset('123-456-789').widget(),
      prop('type').required().enum('page', 'card', 'table', 'panel').preset('card').widget(),
    ]"
  >
    <VtsObjectNotFoundHero v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
</script>
