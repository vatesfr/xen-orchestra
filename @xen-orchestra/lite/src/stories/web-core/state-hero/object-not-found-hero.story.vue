<template>
  <ComponentStory v-slot="{ properties }" :params="[prop('id').required().str().preset('123-456-789').widget()]">
    <ObjectNotFoundHero v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import ObjectNotFoundHero from '@core/components/state-hero/ObjectNotFoundHero.vue'
</script>
