<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('route').type('RouteLocationRaw'),
      prop('disabled').bool().widget(),
      slot(),
      setting('label').preset('User name').widget(),
    ]"
  >
    <UserLink v-bind="properties">{{ settings.label }}</UserLink>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import UserLink from '@core/components/UserLink.vue'
</script>
