<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('format').required().enum('page', 'card', 'panel', 'table').preset('card').widget(),
      prop('busy').bool().widget(),
      prop('horizontal').bool().widget(),
      prop('imageSize').enum('small', 'medium', 'large').preset('medium').widget(),
      prop('type')
        .enum(...STATE_HERO_TYPES)
        .widget(),
      prop('noBackground').bool().widget(),
      slot(),
      setting('defaultSlot').preset('Some text').widget(),
    ]"
  >
    <VtsStateHero v-bind="properties">
      {{ settings.defaultSlot }}
    </VtsStateHero>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { STATE_HERO_TYPES } from '@core/types/state-hero.type.ts'
</script>
