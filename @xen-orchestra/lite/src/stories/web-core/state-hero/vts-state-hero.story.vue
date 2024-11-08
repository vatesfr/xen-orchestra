<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('type').required().enum('page', 'card', 'panel').preset('card').widget(),
      prop('busy').bool().widget(),
      prop('image').enum('no-result', 'under-construction', 'no-selection', 'error').widget(),
      slot(),
      setting('defaultSlot').preset('Some text').widget(),
    ]"
  >
    <VtsStateHero v-bind="properties" class="container">
      {{ settings.defaultSlot }}
    </VtsStateHero>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
</script>
